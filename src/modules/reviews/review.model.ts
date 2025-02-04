import mongoose, { Schema, model } from "mongoose";
import { IReview } from "./reviews.interface";

const reviewSchema = new Schema<IReview>(
  {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
    },
    feedback: {
      type: String,
      default: null,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

export const Review = model("Review", reviewSchema);
