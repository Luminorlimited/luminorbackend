import mongoose, { Schema, model } from "mongoose";
import { IReview } from "./reviews.interface";

const reviewSchema = new Schema<IReview>(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    retireProfessionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RetireProfessional",
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
