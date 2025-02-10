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
exports.ClientService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const paginationHelper_1 = require("../../helpers/paginationHelper");
const searchableField_1 = require("../../constants/searchableField");
const client_model_1 = require("./client.model");
const auth_model_1 = require("../auth/auth.model");
const handleApiError_1 = __importDefault(require("../../errors/handleApiError"));
const serviceMapping_1 = require("../../utilitis/serviceMapping");
const jwtHelpers_1 = require("../../helpers/jwtHelpers");
const config_1 = __importDefault(require("../../config"));
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(config_1.default.stripe.secretKey, {
    apiVersion: "2024-11-20.acacia",
});
const createClient = (user, clientData) => __awaiter(void 0, void 0, void 0, function* () {
    const isUserExist = yield auth_model_1.User.findOne({ email: user.email });
    if (isUserExist) {
        throw new handleApiError_1.default(400, "User Already Exist");
    }
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const customer = yield stripe.customers.create({
            email: user.email,
            name: user.name.firstName + " " + user.name.lastName,
        });
        if (user.stripe) {
            user.stripe.customerId = customer.id;
        }
        const newUser = yield auth_model_1.User.create([user], { session });
        const newClientData = Object.assign(Object.assign({}, clientData), { client: newUser[0]._id });
        yield client_model_1.Client.create([newClientData], { session });
        yield session.commitTransaction();
        const accessToken = jwtHelpers_1.jwtHelpers.createToken({
            id: newUser[0]._id,
            email: newUser[0].email,
            role: newUser[0].role,
        }, config_1.default.jwt.secret, config_1.default.jwt.expires_in);
        return { accessToken, user: newUser, clientData: clientData };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        if (error.code === 11000) {
            throw new handleApiError_1.default(400, "Duplicate email not allowed");
        }
        throw new handleApiError_1.default(400, error.message || "An error occurred");
    }
    finally {
        session.endSession();
    }
});
const getClients = (filters, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { skip, limit, page, sortBy, sortOrder } = paginationHelper_1.paginationHelpers.calculatePagination(paginationOptions);
    const { query } = filters, filtersData = __rest(filters, ["query"]);
    console.log(filtersData, "check filters data");
    const andCondition = [];
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
    if (Object.keys(filtersData).length) {
        andCondition.push(...Object.entries(filtersData).map(([field, value]) => {
            if (field === "minBudget") {
                const minBudget = parseInt(value);
                return {
                    "budgetRange.max": { $gte: minBudget },
                };
            }
            else if (field === "maxBudget") {
                const maxBudget = parseInt(value);
                return {
                    "budgetRange.max": { $gte: maxBudget },
                };
            }
            if (field === "projectMin") {
                const minDuration = parseInt(value);
                return {
                    "projectDurationRange.max": { $gte: minDuration },
                };
            }
            else if (field === "projectMax") {
                const maxDuration = parseInt(value);
                return {
                    "projectDurationRange.max": { $gte: maxDuration },
                };
            }
            else if (field === "industry") {
                const parseArray = Array.isArray(value)
                    ? value
                    : JSON.parse(value);
                return {
                    industry: { $in: parseArray },
                };
            }
            else if (field === "skillType") {
                const skiillTypeArray = Array.isArray(value)
                    ? value
                    : JSON.parse(value);
                return {
                    servicePreference: { $in: skiillTypeArray },
                };
            }
            else if (field === "timeline") {
                if (value === "shortTerm") {
                    return {
                        "projectDurationRange.max": { $lte: 29 },
                    };
                }
                else {
                    return {
                        "projectDurationRange.max": { $gte: 30 },
                    };
                }
            }
            return { [field]: { $regex: value, $options: "i" } };
        }));
    }
    const sortCondition = {};
    if (sortBy && sortOrder) {
        sortCondition[sortBy] = sortOrder;
    }
    const whereConditions = andCondition.length > 0 ? { $and: andCondition } : {};
    const result = yield client_model_1.Client.find(whereConditions)
        .sort(sortCondition)
        .skip(skip)
        .limit(limit)
        .populate("client");
    const count = yield client_model_1.Client.countDocuments();
    if (andCondition.length > 0) {
        return {
            meta: {
                page,
                limit,
                count,
            },
            data: result,
        };
    }
    else {
        return {
            meta: {
                page,
                limit,
                count,
            },
            data: result,
        };
    }
});
const updateSingleClient = (id, auth, clientPayload) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const clientAccount = yield auth_model_1.User.findById(id);
        if (clientPayload.servicePreference) {
            const industries = (0, serviceMapping_1.getIndustryFromService)(clientPayload.servicePreference);
            clientPayload.industry = industries;
        }
        const updatedClient = yield client_model_1.Client.findOneAndUpdate({ client: clientAccount === null || clientAccount === void 0 ? void 0 : clientAccount._id }, clientPayload, {
            new: true,
            session,
        });
        if (!updatedClient) {
            throw new handleApiError_1.default(404, "Client not found");
        }
        const updatedUser = yield auth_model_1.User.findByIdAndUpdate(id, auth, {
            new: true,
            session,
        });
        if (!updatedUser) {
            throw new handleApiError_1.default(404, "User not found");
        }
        yield session.commitTransaction();
        session.endSession();
        return updatedClient.populate("client");
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw new handleApiError_1.default(400, error.message || "Error updating client");
    }
});
const getClientById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield client_model_1.Client.findById(id).populate("client");
    return result;
});
exports.ClientService = {
    createClient,
    getClients,
    updateSingleClient,
    getClientById,
};
