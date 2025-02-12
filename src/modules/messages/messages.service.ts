import { StatusCodes } from "http-status-codes";
import {
  ENUM_NOTIFICATION_STATUS,
  ENUM_NOTIFICATION_TYPE,
} from "../../enums/notificationStatus";

import ApiError from "../../errors/handleApiError";
import { io, onlineUsers, userInChat, users } from "../../server";
import { uploadFileToSpace } from "../../utilitis/uploadTos3";

import { User } from "../auth/auth.model";

import { Convirsation } from "../convirsation/convirsation.model";
import { Notification } from "../notification/notification.model";

import { IMessage } from "./messages.interface";
import { Message } from "./messages.model";

const createMessage = async (payload: IMessage) => {
  // const [sender, recipient] = await Promise.all([
  //   User.findOne({ email: payload.sender }),
  //   User.findOne({ email: payload.recipient }),
  // ]);

  // if (!sender || !recipient) {
  //   throw new Error("Sender or recipient not found.");
  // }
  // console.log(payload, "check payload from create message service");

  let checkRoom = await Convirsation.findOne({
    $and: [
      { $or: [{ user1: payload.sender }, { user1: payload.recipient }] },
      { $or: [{ user2: payload.sender }, { user2: payload.recipient }] },
    ],
  });

  if (!checkRoom) {
    checkRoom = await Convirsation.create({
      user1: payload.sender,
      user2: payload.recipient,
      lastMessage: "",
    });
  }

  const data = {
    sender: payload.sender,
    recipient: payload.recipient,
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

  const recipientInChat = userInChat.get(payload?.recipient.toString());

  if (payload.sender.toString() === checkRoom.user1.toString()) {
    if (!recipientInChat || recipientInChat !== payload.sender.toString()) {
      updateFields.$inc = { user2UnseenCount: 1 };
      updateFields.$push = { user2UnseenMessages: message._id };
    }
  } else {
    if (!recipientInChat || recipientInChat !== payload.sender.toString()) {
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
  // const users = await User.find({ email: { $in: [senderId, recipientId] } });
  // if (users.length < 2) throw new Error("Sender or recipient not found.");
  // const [sender, recipient] = users;
  console.log(senderId,"check sender id")
  console.log(recipientId,"chekc recipeint id")
  const messages = await Message.find({
    $or: [
      { sender: senderId, recipient: recipientId },
      { sender: recipientId, recipient: senderId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate("sender", "name email profileUrl")
    .populate("recipient", "name email profileUrl");

  if (!messages.length) return [];

  const conversationRoom = await Convirsation.findById(messages[0].room)
    .populate("user1", "name email profileUrl")
    .populate("user2", "name email profileUrl");

  if (!conversationRoom)
    throw new ApiError(StatusCodes.NOT_FOUND, "Room not found");
  const isUser1 = loggedInUser === conversationRoom.user1._id.toString();

  const unseenMessageIds = isUser1
    ? conversationRoom.user1UnseenMessages
    : conversationRoom.user2UnseenMessages;
  if (unseenMessageIds.length) {
    await Message.updateMany(
      { _id: { $in: unseenMessageIds } },
      { isUnseen: false }
    );
    await Convirsation.findByIdAndUpdate(conversationRoom.id, {
      $set: isUser1
        ? { user1UnseenMessages: [], user1UnseenCount: 0 }
        : { user2UnseenMessages: [], user2UnseenCount: 0 },
    });
  }
  const userDetails = [
    conversationRoom.user1 as any,
    conversationRoom.user2 as any,
  ].map((user) => ({
    name: `${user.name.firstName} ${user.name.lastName}`,
    email: user.email,
    profileUrl: user.profileUrl || null,
  }));
  return { userDetails, messages };
};
const getSingleMessages = async (sender: string, recipient: string) => {
  const messages = await Message.find({
    $or: [
      { sender: sender, recipient: recipient },
      { sender: recipient, recipient: sender },
    ],
  }).sort({ createdAt: -1 });
  return messages;
};
const getConversationLists = async (id: string) => {
  // const user = await User.findOne({ email });
  // if (!user) {
  //   throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  // }
  const conversations = await Convirsation.find({
    $or: [{ user1: id }, { user2: id }],
  })
    .populate("user1", "email name profileUrl _id")
    .populate("user2", "email name profileUrl _id")
    .sort({ lastMessageTimestamp: -1 });

  const conversationList = conversations.map((conversation: any) => {
    const isUser1 = conversation.user1._id.toString() === id.toString();
    const otherUser = isUser1 ? conversation.user2 : conversation.user1;
    const unseenMessageCount = isUser1
      ? conversation.user1UnseenCount
      : conversation.user2UnseenCount;
    return {
      id: otherUser._id,
      email: otherUser.email,
      name: `${otherUser.name.firstName.trim()} ${otherUser.name.lastName.trim()}`,
      profileUrl: otherUser.profileUrl || null,
      isOnline: onlineUsers.get(otherUser.id) || false,
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
  return { count: totalUnseen.length, totalUnseenId: filterIds };
};
export const MessageService = {
  createMessage,
  getMessages,
  getConversationLists,
  uploadMessagefile,
  countMessages,
  countMessageWithRecipient,
  getSingleMessages,
};
