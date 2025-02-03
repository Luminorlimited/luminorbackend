import { StatusCodes } from "http-status-codes";
import {
  ENUM_NOTIFICATION_STATUS,
  ENUM_NOTIFICATION_TYPE,
} from "../../enums/notificationStatus";
import { ENUM_USER_ROLE } from "../../enums/user";
import ApiError from "../../errors/handleApiError";
import { io, onlineUsers, userInChat, users } from "../../server";
import { uploadFileToSpace } from "../../utilitis/uploadTos3";
import { IUser } from "../auth/auth.interface";

import { User } from "../auth/auth.model";
import { Client } from "../client/client.model";
import { Convirsation } from "../convirsation/convirsation.model";
import { Notification } from "../notification/notification.model";
import { RetireProfessional } from "../professional/professional.model";
import { IMessage } from "./messages.interface";
import { Message } from "./messages.model";
import mongoose from "mongoose";

const createMessage = async (payload: IMessage) => {
  const [sender, recipient] = await Promise.all([
    User.findOne({ email: payload.sender }),
    User.findOne({ email: payload.recipient }),
  ]);

  if (!sender || !recipient) {
    throw new Error("Sender or recipient not found.");
  }

  let checkRoom = await Convirsation.findOne({
    $and: [
      { $or: [{ user1: sender._id }, { user1: recipient._id }] },
      { $or: [{ user2: sender._id }, { user2: recipient._id }] },
    ],
  });

  if (!checkRoom) {
    checkRoom = await Convirsation.create({
      user1: sender._id,
      user2: recipient._id,
      lastMessage: "",
    });
  }

  const data = {
    sender: sender._id,
    recipient: recipient._id,
    message: payload.message || null,
    meetingLink: payload.meetingLink || null,
    media: payload.media || null,
    room: checkRoom._id,
  };

  const message = await Message.create(data);

  let lastMessageContent = payload.message
    ? payload.message
    : payload.media
    ? "📷 Image"
    : payload.meetingLink
    ? "🔗 Meeting Link"
    : "";

  let updateFields: any = {
    lastMessageTimestamp: message.createdAt,
    lastMessage: lastMessageContent,
  };

  const recipientInChat = userInChat.get(recipient.email);

  if (sender._id.toString() === checkRoom.user1.toString()) {
    if (!recipientInChat || recipientInChat !== sender.email) {
      updateFields.$inc = { user2UnseenCount: 1 };
      updateFields.$push = { user2UnseenMessages: message._id };
    }
  } else {
    if (!recipientInChat || recipientInChat !== sender.email) {
      updateFields.$inc = { user1UnseenCount: 1 };
      updateFields.$push = { user1UnseenMessages: message._id };
    }
  }

  await Convirsation.findByIdAndUpdate(checkRoom._id, updateFields, {
    new: true,
  });

  return message;
};
const getMessages = async (
  senderId: string,
  recipientId: string,
  loggedInUser: string
) => {
  const [sender, recipient] = await Promise.all([
    User.findOne({ email: senderId }),
    User.findOne({ email: recipientId }),
  ]);

  // console.log(sender,"check sender")
  // console.log(recipient,"check receiptine")

  if (!sender || !recipient) {
    throw new Error("Sender or recipient not found.");
  }

  const messages = await Message.find({
    $or: [
      { sender: sender._id, recipient: recipient._id },
      { sender: recipient._id, recipient: sender._id },
    ],
  })
    .sort({ createdAt: 1 })
    .populate({
      path: "sender",
      select: "name email profileUrl",
    })
    .populate({
      path: "recipient",
      select: "name email profileUrl",
    });

  if (messages.length) {
    const convirsationRoom = await Convirsation.findById(messages[0].room)
      .populate({
        path: "user1",
        select: "name email profileUrl",
      })
      .populate({
        path: "user2",
        select: "name email profileUrl",
      });
    if (!convirsationRoom) {
      throw new ApiError(StatusCodes.NOT_FOUND, "room not found");
    }

    let unseenMessageIds: any = [];
    let updateFields: any = {};

    if (loggedInUser === convirsationRoom.user1._id.toString()) {
 
      unseenMessageIds = convirsationRoom.user1UnseenMessages;
      updateFields = { 
        user1UnseenMessages: [], 
        user1UnseenCount: 0 
      };
    } else if (loggedInUser === convirsationRoom.user2._id.toString()) {
    
      unseenMessageIds = convirsationRoom.user2UnseenMessages;
      updateFields = { 
        user2UnseenMessages: [], 
        user2UnseenCount: 0 
      };
    }

    await Message.updateMany(
      { _id: { $in: unseenMessageIds } },
      { $set: { isUnseen: false } }
    );
    await Convirsation.findOneAndUpdate({_id:convirsationRoom.id},{$set:updateFields})
    const userDetails = [convirsationRoom.user1, convirsationRoom.user2].map(
      (user: any) => ({
        name: `${user.name.firstName} ${user.name.lastName}`,
        email: user.email,
        profileUrl: user.profileUrl || null,
      })
    );

    return { userDetails, messages };
  } else return [];
};
const getConversationLists = async (email: string) => {
  console.log(email, "check email from service file");
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const conversations = await Convirsation.find({
    $or: [{ user1: user._id }, { user2: user._id }],
  })
    .populate("user1", "email name profileUrl _id")
    .populate("user2", "email name profileUrl _id")
    .sort({ lastMessageTimestamp: -1 });

  const conversationList = conversations.map((conversation: any) => {
    const isUser1 = conversation.user1._id.toString() === user._id.toString();
    const otherUser = isUser1 ? conversation.user2 : conversation.user1;
    const unseenMessageCount = isUser1
      ? conversation.user1UnseenCount
      : conversation.user2UnseenCount;

    return {
      id: otherUser._id,
      email: otherUser.email,
      name: `${otherUser.name.firstName.trim()} ${otherUser.name.lastName.trim()}`,
      profileUrl: otherUser.profileUrl || null,
      isOnline: onlineUsers.get(otherUser.email) || false,
      room: conversation._id,
      lastMessage: conversation.lastMessage,
      lastMessageTimestamp: conversation.lastMessageTimestamp,
      unseenMessageCount,
    };
  });

  return conversationList;
};

const uploadMessagefile = async (file: any) => {
  const fileUrl = await uploadFileToSpace(file, "message-file");
  return fileUrl;
};

const countMessages = async (email: string) => {
  const totalUnseen = await Notification.find({
    recipient: email,
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
    type: ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE,
  }).select("_id");
  const filterIds = totalUnseen.map((message) => message._id.toString());
  // console.log(filterIds,"check filter id")

  return { count: totalUnseen.length, totalUnseenId: filterIds };
};
const countMessageWithRecipient = async (sender: string, recepient: string) => {
  const totalUnseen = await Notification.find({
    sender: sender,
    recipient: recepient,
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
    type: ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE,
  });
  const filterIds = totalUnseen.map((message) => message._id.toString());
  // console.log(filterIds,"check filter id")

  return { count: totalUnseen.length, totalUnseenId: filterIds };
};
const getUnreadMessageCounts = async (
  recipientEmails: string[],
  senderEmail: string
) => {
  const unreadMessages = await Message.aggregate([
    {
      $match: {
        recipient: { $in: recipientEmails },
        sender: senderEmail,
        isRead: false,
      },
    },
    { $group: { _id: "$recipient", count: { $sum: 1 } } },
  ]);

  return unreadMessages.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});
};

export const MessageService = {
  createMessage,
  getMessages,
  getConversationLists,
  uploadMessagefile,
  countMessages,
  countMessageWithRecipient,
};
