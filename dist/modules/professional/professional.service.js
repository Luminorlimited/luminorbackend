"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetireProfessionalService = exports.updateSingleRetireProfessional = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const auth_model_1 = require("../auth/auth.model");
const professional_model_1 = require("./professional.model");
const handleApiError_1 = __importDefault(require("../../errors/handleApiError"));
const paginationHelper_1 = require("../../helpers/paginationHelper");
const searchableField_1 = require("../../constants/searchableField");
const uploadTos3_1 = require("../../utilitis/uploadTos3");
const jwtHelpers_1 = require("../../helpers/jwtHelpers");
const config_1 = __importDefault(require("../../config"));
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(config_1.default.stripe.secretKey, {
    apiVersion: "2024-11-20.acacia",
});
const createProfessional = (user, professionalData, file) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const account = yield stripe.accounts.create({
            type: "express",
            country: "US",
            email: user.email,
        });
        // console.log(account,"check account")
        const accountLink = yield stripe.accountLinks.create({
            account: account.id,
            refresh_url: "https://your-platform.com/reauth",
            return_url: "https://your-platform.com/return",
            type: "account_onboarding",
        });
        if (user.stripe) {
            // console.log(user.stripe, "check stripe");
            user.stripe.onboardingUrl = accountLink.url;
            user.stripe.customerId = account.id;
        }
        const newUser = yield auth_model_1.User.create([user], { session });
        const userId = newUser[0]._id;
        let fileUrl;
        if (file) {
            fileUrl = yield (0, uploadTos3_1.uploadFileToSpace)(file, "retire-professional");
        }
        const newProfessionalData = Object.assign(Object.assign({}, professionalData), { retireProfessional: userId, cvOrCoverLetter: fileUrl });
        yield professional_model_1.RetireProfessional.create([newProfessionalData], { session });
        yield session.commitTransaction();
        session.endSession();
        const accessToken = jwtHelpers_1.jwtHelpers.createToken({
            id: newUser[0]._id,
            email: newUser[0].email,
            role: newUser[0].role,
        }, config_1.default.jwt.secret, config_1.default.jwt.expires_in);
        return {
            accessToken,
            user: newUser,
            retireProfessinal: newProfessionalData,
            stripe: accountLink,
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        if (error instanceof mongodb_1.MongoError && error.code === 11000) {
            throw new handleApiError_1.default(400, "email  must have to be unique");
        }
        throw new handleApiError_1.default(400, error);
    }
});
const updateSingleRetireProfessional = (id, auth, retireProfessionalPayload) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession(); // Start a new session for transaction management
    try {
        session.startTransaction();
        const professionalAccount = yield auth_model_1.User.findById(id);
        if (!professionalAccount) {
            throw new handleApiError_1.default(404, "Professional account not found");
        }
        const updatedRetireProfessional = yield professional_model_1.RetireProfessional.findOneAndUpdate({ retireProfessional: professionalAccount._id }, retireProfessionalPayload, {
            new: true,
            session,
        });
        if (!updatedRetireProfessional) {
            throw new handleApiError_1.default(404, "retire professional not found");
        }
        // console.log(auth,"check auth");
        const updatedUser = yield auth_model_1.User.findByIdAndUpdate(id, auth, {
            new: true, // return the updated document
            session,
        });
        if (!updatedUser) {
            throw new handleApiError_1.default(404, "User not found");
        }
        yield session.commitTransaction();
        session.endSession();
        return updatedRetireProfessional.populate("retireProfessional");
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw new handleApiError_1.default(400, error.message || "Error updating client");
    }
});
exports.updateSingleRetireProfessional = updateSingleRetireProfessional;
const getRetireProfessionals = (filters, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { skip, limit, page, sortBy, sortOrder } = paginationHelper_1.paginationHelpers.calculatePagination(paginationOptions);
    const { query } = filters, filtersData = __rest(filters, ["query"]); // Extract location filter
    const andCondition = [];
    // Handle text search
    if (query) {
        andCondition.push({
            $or: searchableField_1.searchableField.map((field) => ({
                [field]: {
                    $regex: query,
                    $options: "i",
                },
            })),
        });
    }
    // Handle other filters
    if (Object.keys(filtersData).length) {
        andCondition.push(...Object.entries(filtersData).map(([field, value]) => {
            if (field === "industry") {
                const parseArray = Array.isArray(value)
                    ? value
                    : JSON.parse(value);
                return {
                    industry: { $in: parseArray },
                };
            }
            else if (field === "skillType") {
                const skillTypeArray = Array.isArray(value)
                    ? value
                    : JSON.parse(value);
                return {
                    expertise: { $in: skillTypeArray },
                };
            }
            else if (field === "timeline") {
                return value === "shortTerm"
                    ? { availability: { $lte: 29 } }
                    : { availability: { $gte: 30 } };
            }
            return { [field]: { $regex: value, $options: "i" } };
        }));
    }
    // Handle location filter using $geoNear
    const aggregationPipeline = [];
    if (filtersData.location) {
        const [longitude, latitude, minDistance, maxDistance] = JSON.parse(filtersData.location);
        // console.log(longitude, latitude, minDistance, maxDistance);
        aggregationPipeline.push({
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [latitude, longitude],
                },
                distanceField: "distance",
                spherical: true,
                maxDistance: maxDistance,
                minDistance: minDistance,
            },
        });
    }
    // Add match conditions if there are any filters
    if (andCondition.length > 0) {
        aggregationPipeline.push({
            $match: { $and: andCondition },
        });
    }
    // Add a $lookup stage for population
    aggregationPipeline.push({
        $lookup: {
            from: "users", // Replace with the related collection's name
            localField: "retireProfessional", // Field in RetireProfessional
            foreignField: "_id", // Matching field in the related collection
            as: "userDetails", // Populated field name
        },
    });
    // Optionally unwind the array if you want a single object
    aggregationPipeline.push({
        $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true, // Include results with no match
        },
    });
    // Handle sorting, skipping, and limiting
    const sortCondition = {};
    if (sortBy && sortOrder) {
        sortCondition[sortBy] = sortOrder === "desc" ? -1 : 1;
    }
    aggregationPipeline.push({ $sort: sortCondition }, { $skip: skip }, { $limit: limit });
    // Execute the aggregation pipeline
    const result = yield professional_model_1.RetireProfessional.aggregate(aggregationPipeline).exec();
    // Get total document count
    const count = yield professional_model_1.RetireProfessional.countDocuments();
    return {
        meta: {
            page,
            limit,
            count,
        },
        data: result,
    };
});
const getRetireProfessionalsByLocation = (long, lat, min, max) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield professional_model_1.RetireProfessional.find({
        location: {
            $near: {
                $maxDistance: max, // in meters
                $minDistance: min,
                $geometry: {
                    type: "Point",
                    coordinates: [lat, long],
                },
            },
        },
    });
    return result;
});
const getRetireProfessionalById = (professionalId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield professional_model_1.RetireProfessional.findById(professionalId).populate("retireProfessional");
    return result;
});
const updateProfessionalStripeAccount = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log(payload,"check payload from updateprofessional account")
    yield auth_model_1.User.findOneAndUpdate({ email: payload.email }, {
        $set: {
            "stripe.customerId": payload.id,
            "stripe.isOnboardingSucess": true,
        },
    });
});
exports.RetireProfessionalService = {
    createProfessional,
    updateSingleRetireProfessional: exports.updateSingleRetireProfessional,
    getRetireProfessionals,
    getRetireProfessionalsByLocation,
    getRetireProfessionalById,
    updateProfessionalStripeAccount,
};
