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
    user1UnseenMessages: [{ type: mongoose.Schema.ObjectId, ref: "Message" }],
    user2UnseenMessages: [{ type: mongoose.Schema.ObjectId, ref: "Message" }]
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

export const Convirsation = model("Convirsation", convirsationModel);
