import {
  ENUM_NOTIFICATION_STATUS,
  ENUM_NOTIFICATION_TYPE,
} from "../../enums/notificationStatus";

import { io } from "../../server";
import { userInChat, users } from "../../socket";
import { MessageService } from "../messages/messages.service";
import { INotification } from "./notification.interface";
import { Notification } from "./notification.model";

const createNotification = async (payload: INotification, event: string) => {
  
  const recipientInChatWith = userInChat.get(payload.recipient.toString());
  if (payload.type===ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE&& recipientInChatWith === payload.sender.toString()) {

    return ; 
  }
  const result = await Notification.create(payload);
  const unseenCount  =   await Notification.countDocuments({
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
   
  });

  // // else if(payload.typ===ENUM_NOTIFICATION_TYPE.ORDER){
   
  // // }
  const toSocketId = users[payload.recipient.toString()];
  // console.log(toSocketId,"check to socket id")
  // console.log(payload.recipient,"check recipient")
  // console.log(payload.sender,"check sender")
  if (result) {
    io.to(toSocketId).emit(event, {
      toUser: payload.recipient,
      message: payload.message,
      fromUser: payload.sender,
      type: payload.type,
      status: payload.status,
      count: unseenCount,
      notificationId:result._id
    });
  }
  return result;
};

const getUserNotification = async (
  recipient: string,
  
) => {
  let filters: any = {};

  // if (status && recipient && type) {
  //   filters.recipient = recipient;
  //   filters.status = status;
  //   filters.type = type;
  // } else if (status && recipient) {
  //   filters.recipient = recipient;
  //   filters.status = status;
  // } else if (recipient && type) {
  //   filters.recipient = recipient;

  //   filters.type = type;
  // } else if (recipient) {
  //   filters.recipient = recipient;
  // }

  const result = await Notification.find({recipient:recipient}).sort({ createdAt: -1 });
  const count=await Notification.countDocuments({recipient:recipient,status:ENUM_NOTIFICATION_STATUS.UNSEEN})
  return {result,count,};
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
export const NotificationService = {
  createNotification,
  getUserNotification,
  updateNotification,
  updateMessageNotification,
  updateSingleUserMessageNotification,
};
