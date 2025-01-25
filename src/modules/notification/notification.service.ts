import {
  ENUM_NOTIFICATION_STATUS,
  ENUM_NOTIFICATION_TYPE,
} from "../../enums/notificationStatus";
import { ObjectId } from "mongodb";
import { io } from "../../server";
import { MessageService } from "../messages/messages.service";
import { INotification } from "./notification.interface";
import { Notification } from "./notification.model";

const createNotification = async (payload: INotification, event: string) => {
  const result = await Notification.create(payload);
  let count;
  if (payload.type === ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE) {
    count = await MessageService.countMessages(payload.recipient);
  }
  if (result) {
    io.emit(event, {
      toEmail: payload.recipient,
      message: payload.message,
      fromEmail: payload.sender,
      type: payload.type,
      status: payload.status,
      count: count,
    });
  }
  return result;
};

const getUserNotification = async (
  recipient: string,
  status: string,
  type: string
) => {
  let filters: any = {};

  if (status && recipient && type) {
    filters.recipient = recipient;
    filters.status = status;
    filters.type = type;
  } else if (status && recipient) {
    filters.recipient = recipient;
    filters.status = status;
  } else if (recipient && type) {
    filters.recipient = recipient;

    filters.type = type;
  } else if (recipient) {
    filters.recipient = recipient;
  }

  const result = await Notification.find(filters).sort({ createdAt: -1 });
  return result;
};
const updateNotification = async (id: string) => {
  const result = await Notification.findOneAndUpdate(
    { _id: id },
    { status: ENUM_NOTIFICATION_STATUS.SEEN },
    {
      new: true,
    }
  );
  return result;
};
const updateMessageNotification= async (ids: string[]) => {

  const result = await Notification.updateMany(
    {
      _id: { $in: ids }, 
    },
    { status: ENUM_NOTIFICATION_STATUS.SEEN },
    {
      new: true,
    }
  );
  return result;
};
export const NotificationService = {
  createNotification,
  getUserNotification,
  updateNotification,
  updateMessageNotification
};
