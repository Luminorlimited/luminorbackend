import mongoose, { Schema, model } from "mongoose";
import { INotification } from "./notification.interface";
import { NotificationStatus, NotificationType } from "./notfication.const";
import { ENUM_NOTIFICATION_STATUS } from "../../enums/notificationStatus";

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
           required: true,
           ref: "User",
    },

    sender: {
     type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "User",
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: NotificationType,
      index: true,
    },
    status: {
      type: String,
      enum: NotificationStatus,
      default: ENUM_NOTIFICATION_STATUS.UNSEEN,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey:false
  }
);

export const Notification = model<INotification>(
  "notification",
  NotificationSchema
);