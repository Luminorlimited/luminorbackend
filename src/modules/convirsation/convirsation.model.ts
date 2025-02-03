import mongoose, { Mongoose, Schema, model } from "mongoose";
import { Iconvirsation } from "./convirsation.interface";

const convirsationModel = new Schema<Iconvirsation>(
  {
    user1: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },

    user2: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    lastMessageTimestamp: {
      type: Date,
      default: null,
    },
    lastMessage: {
      type: String,
    },
    user1UnseenCount: {
      type: Number,
      default: 0,
    },
    user2UnseenCount: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

export const Convirsation = model("Convirsation", convirsationModel);
