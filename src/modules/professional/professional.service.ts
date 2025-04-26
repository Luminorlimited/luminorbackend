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

;
import { jwtHelpers } from "../../helpers/jwtHelpers";
import { Secret } from "jsonwebtoken";
import config from "../../config";
import { IFilters } from "../../interfaces/filter";
import Stripe from "stripe";
import emailSender from "../../utilitis/emailSender";
import { uploadFileToSpace } from "../../utilitis/uploadTos3";



const stripe = new Stripe(config.stripe.secretKey as string, {
  apiVersion: "2025-01-27.acacia",
});
const createProfessional = async (
  user: IUser,
  professionalData: IProfessional,
  file: Express.Multer.File
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // // Create a Stripe account
    // const account = await stripe.accounts.create({
    //   type: "express",
    //   country: "US",
    //   email: user.email,
    // });

    // const accountLink = await stripe.accountLinks.create({
    //   account: account.id,
    //   refresh_url: "https://your-platform.com/reauth",
    //   return_url: "https://www.luminor-ltd.com",
    //   type: "account_onboarding",
    // });

    // if (user.stripe) {
    //   user.stripe.onboardingUrl = accountLink.url;
    //   user.stripe.customerId = account.id;
    // }

    // Create User
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

    // Create Professional Data
    await RetireProfessional.create([newProfessionalData], { session });

    // Commit Transaction
    await session.commitTransaction();
    session.endSession();

    // Send onboarding email **only after a successful transaction**
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Profile Under Review</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #5633d1; padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">Profile Under Review</h1>
            </div>
            <div style="padding: 20px 20px; text-align: left;">
                <p style="font-size: 18px; color: #333333; margin-bottom: 10px;">Dear <b>${user.name.firstName}</b>,</p>
                <p style="font-size: 16px; color: #333333; margin-bottom: 16px;">Thank you for registering as a retired professional on <strong>Luminor</strong>.</p>
                <p style="font-size: 16px; color: #333333; margin-bottom: 16px;">We have successfully received your information. Our team is currently reviewing your profile to ensure everything meets our onboarding criteria.</p>
                <p style="font-size: 16px; color: #333333; margin-bottom: 16px;">You will receive an update via email once the verification process is complete. If we require any additional information, please contact using this email address.</p>
                 <p style="font-size: 16px; font-weight: bold; color: #5633d1;">📧 luminorlimited@gmail.com</p>
                <p style="font-size: 16px; color: #333333; margin-bottom: 24px;">Thank you for your patience and welcome aboard!</p>
                <p style="font-size: 16px; color: #333333;"><strong>The Luminor Support Team</strong></p>
    
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
                    <p style="font-size: 14px; color: #888888; margin-bottom: 4px;">If you didn’t create this account or believe this was a mistake, please contact our support team immediately.</p>
                </div>
            </div>
            <div style="background-color: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #999999;">
                <p style="margin: 0;">© 2025 Luminor. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
  await emailSender("Profile Under Review  Luminor", user.email, html);
  

    // Generate access token
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
      
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    if (error instanceof MongoError && error.code === 11000) {
      throw new ApiError(400, "Email must be unique");
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
;
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
            return { availability: { $lt: 30 } };
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
