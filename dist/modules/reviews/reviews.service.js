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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const professional_model_1 = require("../professional/professional.model");
const client_model_1 = require("../client/client.model");
const review_model_1 = require("./review.model");
const handleApiError_1 = __importDefault(require("../../errors/handleApiError"));
const http_status_codes_1 = require("http-status-codes");
const postReviews = (receiverId, retireProfessionalId, reviewData) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const retireProfessional = yield professional_model_1.RetireProfessional.findOne({
            retireProfessional: retireProfessionalId,
        }).session(session);
        if (!retireProfessional) {
            throw new Error("RetireProfessional not found");
        }
        const client = yield client_model_1.Client.findOne({ client: receiverId });
        if (!client) {
            throw new handleApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "client not found");
        }
        const newReview = yield review_model_1.Review.create([
            Object.assign(Object.assign({}, reviewData), { retireProfessionalId: retireProfessional._id, clientId: client._id }),
        ], { session });
        const reviews = yield review_model_1.Review.find({
            retireProfessionalId: retireProfessional._id,
        }).session(session);
        const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRatings / reviews.length;
        // console.log(averageRating,"check average rating")
        yield professional_model_1.RetireProfessional.updateOne({ _id: retireProfessional._id }, { averageRating, reviewCount: reviews.length }, { session });
        yield session.commitTransaction();
        return newReview;
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
const getReviews = (retireProfessionalId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reviews = yield review_model_1.Review.find({ retireProfessionalId })
            .populate("clientId", "name email")
            .sort({ createdAt: -1 });
        return reviews;
    }
    catch (error) {
        throw error;
    }
});
exports.ReviewsService = {
    postReviews,
    getReviews,
};
