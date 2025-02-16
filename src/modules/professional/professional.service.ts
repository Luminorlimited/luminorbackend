import mongoose, { SortOrder } from "mongoose";
import { MongoError } from "mongodb";
import { IUser } from "../auth/auth.interface";
import { IProfessional } from "./professional.interface";
import { User } from "../auth/auth.model";
import { RetireProfessional } from "./professional.model";
import ApiError from "../../errors/handleApiError";
import { IpaginationOptions } from "../../interfaces/pagination";
import { IGenericResponse } from "../../interfaces/general";
import { paginationHelpers } from "../../helpers/paginationHelper";
import { searchableField } from "../../constants/searchableField";

import { uploadFileToSpace } from "../../utilitis/uploadTos3";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import { Secret } from "jsonwebtoken";
import config from "../../config";
import { IFilters } from "../../interfaces/filter";
import Stripe from "stripe";
import emailSender from "../../utilitis/emailSender";
const stripe = new Stripe(config.stripe.secretKey as string, {
  apiVersion: "2024-11-20.acacia",
});
const createProfessional = async (
  user: IUser,
  professionalData: IProfessional,
  file: Express.Multer.File
) => {
  console.log(user, "user");
  console.log(professionalData, "professional data");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    console.log(user, professionalData, "check professional data");
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: user.email,
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "https://your-platform.com/reauth",
      return_url: "https://luminoor.vercel.app",
      type: "account_onboarding",
    });

    if (user.stripe) {
      user.stripe.onboardingUrl = accountLink.url;
      user.stripe.customerId = account.id;
    }

    const html = `
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333; border: 1px solid #ddd; border-radius: 10px;">
    <h2 style="color: #007bff; text-align: center;">Complete Your Onboarding</h2>
  
    <p>Dear <b>${user.name.firstName}</b>,</p>
  
    <p>We’re excited to have you onboard! To get started, please complete your onboarding process by clicking the link below:</p>
  
    <div style="text-align: center; margin: 20px 0;">
      <a href=${accountLink.url} style="background-color: #007bff; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
        Complete Onboarding
      </a>
    </div>
  
    <p>If the button above doesn’t work, you can also copy and paste this link into your browser:</p>
    <p style="word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 5px;">
      ${accountLink.url}
    </p>
  
    <p><b>Note:</b> This link is valid for a limited time. Please complete your onboarding as soon as possible.</p>
  
    <p>Thank you,</p>
    <p><b>The Support Team</b></p>
  
    <hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;">
    <p style="font-size: 12px; color: #777; text-align: center;">
      If you didn’t request this, please ignore this email or contact support.
    </p>
  </div>
  `;
    await emailSender("Your Onboarding Url", user.email, html);

    const newUser = await User.create([user], { session });
    const userId = newUser[0]._id;
    let fileUrl;
    if (file) {
      fileUrl = await uploadFileToSpace(file, "retire-professional");
    }

    const newProfessionalData = {
      ...professionalData,
      retireProfessional: userId,
      cvOrCoverLetter: fileUrl,
    };

    await RetireProfessional.create([newProfessionalData], { session });

    await session.commitTransaction();
    session.endSession();
    const accessToken = jwtHelpers.createToken(
      {
        id: newUser[0]._id,
        email: newUser[0].email,
        role: newUser[0].role,
      },
      config.jwt.secret as Secret,
      config.jwt.expires_in as string
    );
    return {
      accessToken,
      user: newUser,
      retireProfessinal: newProfessionalData,
      stripe: accountLink,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    if (error instanceof MongoError && error.code === 11000) {
      throw new ApiError(400, "email  must have to be unique");
    }
    throw new ApiError(400, error);
  }
};
export const updateSingleRetireProfessional = async (
  id: string,
  auth: Partial<IProfessional>,
  retireProfessionalPayload: Partial<IProfessional>
): Promise<IProfessional | null> => {
  const session = await mongoose.startSession();
  console.log(auth, "check auth");
  console.log(retireProfessionalPayload, "check retire professional payload");
  try {
    session.startTransaction();
    const professionalAccount = await User.findById(id);
    const updatedRetireProfessional = await RetireProfessional.findOneAndUpdate(
      { retireProfessional: professionalAccount?._id },
      retireProfessionalPayload,
      {
        new: true,
        session,
      }
    );
    if (!updatedRetireProfessional) {
      throw new ApiError(404, "retire professional not found");
    }

    console.log(retireProfessionalPayload, auth);
    const updatedUser = await User.findByIdAndUpdate(id, auth, {
      new: true,
      session,
    });
    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }
    await session.commitTransaction();
    session.endSession();
    return updatedRetireProfessional.populate("retireProfessional");
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(400, error.message || "Error updating client");
  }
};
const getRetireProfessionals = async (
  filters: IFilters,
  paginationOptions: IpaginationOptions
): Promise<IGenericResponse<IProfessional[]>> => {
  const { skip, limit, page, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);
  const { query, ...filtersData } = filters;
  console.log(filtersData, "check filters data");
  const andCondition = [];
  if (query) {
    andCondition.push({
      $or: searchableField.map((field) => ({
        [field]: {
          $regex: query as string,
          $options: "i",
        },
      })),
    });
  }
  if (Object.keys(filtersData).length) {
    andCondition.push(
      ...Object.entries(filtersData).map(([field, value]) => {
        if (field === "industry") {
          console.log(field, "check field");
          const parseArray = Array.isArray(value)
            ? value
            : JSON.parse(value as string);
          return {
            industry: { $in: parseArray },
          };
        } else if (field === "skillType") {
          const skillTypeArray = Array.isArray(value)
            ? value
            : JSON.parse(value as string);
          return {
            expertise: { $in: skillTypeArray },
          };
        } else if (field === "timeline") {
          let timelineValues: string[] = [];

          try {
            timelineValues =
              typeof value === "string" ? JSON.parse(value) : value;
          } catch (error) {
            console.error("Error parsing timeline values:", error);
            timelineValues = [];
          }

          if (
            timelineValues.includes("shortTerm") &&
            timelineValues.includes("Long Term")
          ) {
            return {};
          } else if (timelineValues.includes("shortTerm")) {
            return { availability: { $lte: 29 } };
          } else if (timelineValues.includes("Long Term")) {
            return { availability: { $gte: 30 } };
          }

          return {};
        }

        return { [field]: { $regex: value as string, $options: "i" } };
      })
    );
  }
  const aggregationPipeline: any[] = [];
  if (filtersData.location) {
    const [longitude, latitude, minDistance, maxDistance] = JSON.parse(
      filtersData.location
    );
    console.log(latitude, longitude, maxDistance, minDistance, "check data");
    aggregationPipeline.push({
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        distanceField: "distance",
        spherical: true,
        maxDistance: maxDistance,
        minDistance: minDistance,
      },
    });
  }
  if (andCondition.length > 0) {
    aggregationPipeline.push({
      $match: { $and: andCondition },
    });
  }
  aggregationPipeline.push({
    $lookup: {
      from: "users",
      localField: "retireProfessional",
      foreignField: "_id",
      as: "userDetails",
    },
  });
  aggregationPipeline.push({
    $unwind: {
      path: "$userDetails",
      preserveNullAndEmptyArrays: true,
    },
  });
  const sortCondition: { [key: string]: SortOrder } = {};
  if (sortBy && sortOrder) {
    sortCondition[sortBy] = sortOrder === "desc" ? -1 : 1;
  }
  aggregationPipeline.push(
    { $sort: sortCondition },
    { $skip: skip },
    { $limit: limit }
  );

  const result = await RetireProfessional.aggregate(aggregationPipeline).exec();
  const count = await RetireProfessional.countDocuments();
  return {
    meta: {
      page,
      limit,
      count,
    },
    data: result,
  };
};
const getRetireProfessionalsByLocation = async (
  long: number,
  lat: number,
  min: number,
  max: number
) => {
  console.log(long, lat);
  const result = await RetireProfessional.find({
    location: {
      $near: {
        $maxDistance: max,
        $minDistance: min,
        $geometry: {
          type: "Point",
          coordinates: [long, lat],
        },
      },
    },
  });
  return result;
};
const getRetireProfessionalById = async (
  professionalId: string
): Promise<IProfessional | null> => {
  const result = await RetireProfessional.findById(professionalId).populate(
    "retireProfessional"
  );
  return result;
};
const updateProfessionalStripeAccount = async (payload: any) => {
  const updatedUser = await User.findOneAndUpdate(
    { email: payload.email },
    {
      $set: {
        "stripe.customerId": payload.id,
        "stripe.isOnboardingSucess": true,
        "stripe.onboardingUrl": null,
      },
    }
  );
  if (updatedUser) {
    // Request 'transfers' capability for the account
    await stripe.accounts.update(payload.id, {
      capabilities: {
        transfers: { requested: true },
      },
    });

    console.log(`Transfers capability requested for ${payload.id}`);
  }
};
export const RetireProfessionalService = {
  createProfessional,
  updateSingleRetireProfessional,
  getRetireProfessionals,
  getRetireProfessionalsByLocation,
  getRetireProfessionalById,
  updateProfessionalStripeAccount,
};
