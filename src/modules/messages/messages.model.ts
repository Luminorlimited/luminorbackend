import mongoose, { Schema, model } from "mongoose";
import { IMessage } from "./messages.interface";

const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Convirsation",
    },

    message: {
      type: String,
      default: null,
    },
    media: {
      type: String,
      default: null,
    },
    meetingLink: {
      type: String,
      default: null,
    },
    isUnseen: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

export const Message = model("Message", messageSchema);
