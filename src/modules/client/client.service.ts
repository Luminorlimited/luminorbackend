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
    // console.log("Transaction started");

    session.startTransaction();

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name.firstName + " " + user.name.lastName,
    });
    // console.log(account,"check account")
  

    if (user.stripe) {
      user.stripe.customerId = customer.id;
    }

    const newUser = await User.create([user], { session });

    const newClientData = { ...clientData, client: newUser[0]._id };
    const newClient = await Client.create([newClientData], { session });

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

  //  console.log(filtersData)
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
        // Handle budget range
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

        // Handle project duration range
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
          //  console.log(value,"check value from client get clients")
          // const industryArray = (value as string).split(',').map((item) => item.trim());

          const parseArray = Array.isArray(value)
            ? value
            : JSON.parse(value as string);
          //console.log(parseArray, "check parse arrya");
          return {
            industry: { $in: parseArray },
          };
        } else if (field === "skillType") {
          const skiillTypeArray = Array.isArray(value)
            ? value
            : JSON.parse(value as string);
          // console.log(skiillTypeArray);

          return {
            servicePreference: { $in: skiillTypeArray },
          };
        } else if (field === "timeline") {
          if (value === "shortTerm") {
            // console.log("for shorterm");
            return {
              "projectDurationRange.max": { $lte: 29 }, // Projects with duration less than or equal to 30
            };
          } else {
            return {
              "projectDurationRange.max": { $gte: 30 }, // Projects with duration greater than or equal to 30
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
  const session = await mongoose.startSession(); // Start a new session for transaction management
  try {
    session.startTransaction();
    const clientAccount = await User.findById(id);
    console.log(clientAccount, "check client account");
    if (!clientAccount) {
      throw new ApiError(404, "Client account not found");
    }

    if (clientPayload.servicePreference) {
      const industries = getIndustryFromService(
        clientPayload.servicePreference
      );
      clientPayload.industry = industries;
    }

    
    const updatedClient = await Client.findOneAndUpdate(
      { client: clientAccount._id },
      clientPayload,
      {
        new: true,
        session,
      }
    );

    if (!updatedClient) {
      throw new ApiError(404, "Client not found");
    }
    // console.log(auth,"check auth");


    const updatedUser = await User.findByIdAndUpdate(id, auth, {
      new: true, // return the updated document
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
