import mongoose from "mongoose";
import { RetireProfessional } from "../professional/professional.model";

import { Client } from "../client/client.model";
import { Review } from "./review.model";
import ApiError from "../../errors/handleApiError";
import { StatusCodes } from "http-status-codes";

const postReviewsByClient = async (
  reviewerId: string,
  receiverId: string,
  reviewData: any
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const retireProfessional = await RetireProfessional.findOne({
      retireProfessional: receiverId,
    }).session(session);
    if (!retireProfessional) {
      throw new Error("RetireProfessional not found");
    }

    // const client = await Client.findOne({ client: reviewerId });
    // if (!client) {
    //   throw new ApiError(StatusCodes.UNAUTHORIZED, "client not found");
    // }

    const newReview = await Review.create(
      [
        {
          ...reviewData,
          receiverId: receiverId,
          reviewerId: reviewerId,
        },
      ],
      { session }
    );

    const reviews = await Review.find({
      receiverId: receiverId,
    }).session(session);
 
    const totalRatings = reviews.reduce(
      (sum: number, review: { rating: number }) => sum + review.rating,
      0
    );
    const averageRating = totalRatings / reviews.length;
    // console.log(averageRating,"check average rating")

    await RetireProfessional.updateOne(
      { _id: retireProfessional._id },
      { averageRating, reviewCount: reviews.length },

      { session }
    );

    await session.commitTransaction();
    return newReview;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const postReviewsByRetireProfessional = async (
  reviewerId: string,
  receiverId: string,
  reviewData: any
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
   
    const client = await Client.findOne({ client: receiverId });
    if (!client) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "client not found");
    }

    const newReview = await Review.create(
      [
        {
          ...reviewData,
          reviewerId: reviewerId,
          receiverId: receiverId,
        },
      ],
      { session }
    );

    const reviews = await Review.find({
      receiverId: receiverId,
    }).session(session);

    const totalRatings = reviews.reduce(
      (sum: number, review: { rating: number }) => sum + review.rating,
      0
    );
    const averageRating = totalRatings / reviews.length;
    // console.log(averageRating,"check average rating")

    await Client.updateOne(
      { _id: client._id },
      { averageRating, reviewCount: reviews.length },

      { session }
    );

    await session.commitTransaction();
    return newReview;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getReviews = async (retireProfessionalId: string) => {
  try {
    const reviews = await Review.find({ retireProfessionalId })
      .populate("clientId", "name email")
      .sort({ createdAt: -1 });

    return reviews;
  } catch (error) {
    throw error;
  }
};

export const ReviewsService = {
  postReviewsByClient,
  postReviewsByRetireProfessional,
  getReviews,
};
