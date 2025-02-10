import mongoose, { SortOrder } from "mongoose";

import { IClient } from "./client.interface";
import { IpaginationOptions } from "../../interfaces/pagination";
import { IGenericResponse } from "../../interfaces/general";
import { paginationHelpers } from "../../helpers/paginationHelper";
import { searchableField } from "../../constants/searchableField";
import { Client } from "./client.model";
import { User } from "../auth/auth.model";
import { IUser } from "../auth/auth.interface";
import ApiError from "../../errors/handleApiError";
import { getIndustryFromService } from "../../utilitis/serviceMapping";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import config from "../../config";
import { Secret } from "jsonwebtoken";
import { IFilters } from "../../interfaces/filter";
import Stripe from "stripe";
const stripe = new Stripe(config.stripe.secretKey as string, {
  apiVersion: "2024-11-20.acacia",
});
const createClient = async (user: IUser, clientData: IClient) => {
  const isUserExist = await User.findOne({ email: user.email });
  if (isUserExist) {
    throw new ApiError(400, "User Already Exist");
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name.firstName + " " + user.name.lastName,
    });
    if (user.stripe) {
      user.stripe.customerId = customer.id;
    }
    const newUser = await User.create([user], { session });

    const newClientData = { ...clientData, client: newUser[0]._id };
    await Client.create([newClientData], { session });
    await session.commitTransaction();
    const accessToken = jwtHelpers.createToken(
      {
        id: newUser[0]._id,
        email: newUser[0].email,
        role: newUser[0].role,
      },
      config.jwt.secret as Secret,
      config.jwt.expires_in as string
    );
    return { accessToken, user: newUser, clientData: clientData };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    if (error.code === 11000) {
      throw new ApiError(400, "Duplicate email not allowed");
    }
    throw new ApiError(400, error.message || "An error occurred");
  } finally {
    session.endSession();
  }
};
const getClients = async (
  filters: IFilters,
  paginationOptions: IpaginationOptions
): Promise<IGenericResponse<IClient[]>> => {
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
        if (field === "minBudget") {
          const minBudget = parseInt(value as string);
          return {
            "budgetRange.max": { $gte: minBudget },
          };
        } else if (field === "maxBudget") {
          const maxBudget = parseInt(value as string);
          return {
            "budgetRange.max": { $gte: maxBudget },
          };
        }
        if (field === "projectMin") {
          const minDuration = parseInt(value as string);
          return {
            "projectDurationRange.max": { $gte: minDuration },
          };
        } else if (field === "projectMax") {
          const maxDuration = parseInt(value as string);
          return {
            "projectDurationRange.max": { $gte: maxDuration },
          };
        } else if (field === "industry") {
          const parseArray = Array.isArray(value)
            ? value
            : JSON.parse(value as string);
          return {
            industry: { $in: parseArray },
          };
        } else if (field === "skillType") {
          const skiillTypeArray = Array.isArray(value)
            ? value
            : JSON.parse(value as string);
          return {
            servicePreference: { $in: skiillTypeArray },
          };
        } else if (field === "timeline") {
          if (value === "shortTerm") {
            return {
              "projectDurationRange.max": { $lte: 29 },
            };
          } else {
            return {
              "projectDurationRange.max": { $gte: 30 },
            };
          }
        }
        return { [field]: { $regex: value as string, $options: "i" } };
      })
    );
  }
  const sortCondition: { [key: string]: SortOrder } = {};
  if (sortBy && sortOrder) {
    sortCondition[sortBy] = sortOrder;
  }
  const whereConditions = andCondition.length > 0 ? { $and: andCondition } : {};
  const result = await Client.find(whereConditions)
    .sort(sortCondition)
    .skip(skip)
    .limit(limit)
    .populate("client");
  const count = await Client.countDocuments();
  if (andCondition.length > 0) {
    return {
      meta: {
        page,
        limit,
        count,
      },
      data: result,
    };
  } else {
    return {
      meta: {
        page,
        limit,
        count,
      },
      data: result,
    };
  }
};
const updateSingleClient = async (
  id: string,
  auth: Partial<IClient>,
  clientPayload: Partial<IClient>
): Promise<IClient | null> => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const clientAccount = await User.findById(id);
    if (clientPayload.servicePreference) {
      const industries = getIndustryFromService(
        clientPayload.servicePreference
      );
      clientPayload.industry = industries;
    }
    const updatedClient = await Client.findOneAndUpdate(
      { client: clientAccount?._id },
      clientPayload,
      {
        new: true,
        session,
      }
    );

    if (!updatedClient) {
      throw new ApiError(404, "Client not found");
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
    return updatedClient.populate("client");
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(400, error.message || "Error updating client");
  }
};
const getClientById = async (id: string): Promise<IClient | null> => {
  const result = await Client.findById(id).populate("client");
  return result;
};
export const ClientService = {
  createClient,
  getClients,
  updateSingleClient,
  getClientById,
};
