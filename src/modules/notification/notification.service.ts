import {
  ENUM_NOTIFICATION_STATUS,
  ENUM_NOTIFICATION_TYPE,
} from "../../enums/notificationStatus";

import { io } from "../../server";
import { userInChat, users } from "../../socket";
import { MessageService } from "../messages/messages.service";
import eventEmitter from "../sse/eventEmitter";
import { NotificationType } from "./notfication.const";
import { INotification } from "./notification.interface";
import { Notification } from "./notification.model";

const createNotification = async (payload: INotification, event: string) => {
  const recipientInChatWith = userInChat.get(payload.recipient.toString());

  if (
    payload.type === ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE &&
    recipientInChatWith === payload.sender.toString()
  ) {
    return;
  }

  const result = await Notification.create(payload);
  if (ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE === payload.type) {
    eventEmitter.emit("event:message-count", {
      userId: payload.recipient.toString(),
    });
  } else {
    eventEmitter.emit("event:notification-count", {
      userId: payload.recipient.toString(),
    });
  }

  const unseenCount = await Notification.countDocuments({
    recipient: payload.recipient,
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
  });

  // // else if(payload.typ===ENUM_NOTIFICATION_TYPE.ORDER){

  // // }
  const toSocketId = users[payload.recipient.toString()];

  if (result) {
    io.to(toSocketId).emit(event, {
      toUser: payload.recipient,
      message: payload.message,
      fromUser: payload.sender,
      type: payload.type,
      status: payload.status,
      count: unseenCount,
      orderId: payload.orderId,

      notificationId: result._id,
    });
  }
  return result;
};

const getUserNotification = async (recipient: string) => {
  const result = await Notification.find({
    recipient: recipient,
    type: { $ne: ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE },
  }).sort({
    createdAt: -1,
  });
  const count = await Notification.countDocuments({
    recipient: recipient,
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
    type: { $ne: ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE },
  });
  return { result, count };
};
const getMessageNotification = async (recipient: string) => {
  const result = await Notification.find({
    recipient: recipient,
    type: ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE,
  }).sort({
    createdAt: -1,
  });
  const count = await Notification.countDocuments({
    recipient: recipient,
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
    type: ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE,
  });
  return { result, count };
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
const updateMessageNotification = async (ids: string[]) => {
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
const updateSingleUserMessageNotification = async (
  sender: string,
  recipient: string
) => {
  const result = await Notification.updateMany(
    {
      recipient: recipient,
      sender: sender,
      type: ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE,
    },
    { status: ENUM_NOTIFICATION_STATUS.SEEN },
    {
      new: true,
    }
  );
  return result;
};

const messageCount = async (recipient: string) => {
  const count = await Notification.countDocuments({
    recipient: recipient,
    type: ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE,
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
  });
  return count;
};

const otherNotificationCount = async (recipient: string) => {
  const count = await Notification.countDocuments({
    recipient: recipient,
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
    type: { $ne: ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE },
  });
  return count;
};
export const NotificationService = {
  createNotification,
  getUserNotification,
  updateNotification,
  updateMessageNotification,
  updateSingleUserMessageNotification,
  messageCount,
  otherNotificationCount,
  getMessageNotification,
};
