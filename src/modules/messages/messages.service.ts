import { StatusCodes } from "http-status-codes";
import {
  ENUM_NOTIFICATION_STATUS,
  ENUM_NOTIFICATION_TYPE,
} from "../../enums/notificationStatus";

import ApiError from "../../errors/handleApiError";

import { uploadFileToSpace } from "../../utilitis/uploadTos3";

import { Convirsation } from "../convirsation/convirsation.model";
import { Notification } from "../notification/notification.model";

import { IMessage } from "./messages.interface";
import { Message } from "./messages.model";
import { onlineUsers, userInChat } from "../../socket";

const createMessage = async (payload: IMessage) => {
  console.log(payload, "check message payload");

  // Corrected query to find a conversation between two specific users
  let checkRoom = await Convirsation.findOne({
    $or: [
      { user1: payload.sender, user2: payload.recipient },
      { user1: payload.recipient, user2: payload.sender }
    ]
  });

  // Create conversation if not found, with correct field initialization
  if (!checkRoom) {
    checkRoom = await Convirsation.create({
      user1: payload.sender,
      user2: payload.recipient,
      lastMessage: "",
      user1UnseenCount: 0,
      user2UnseenCount: 0,
      user1UnseenMessages: [],
      user2UnseenMessages: []
    });
  }

  // Prepare message data
  const data = {
    sender: payload.sender,
    recipient: payload.recipient,
    message: payload.message || null,
    meetingLink: payload.meetingLink || null,
    media: payload.media || null,
    room: checkRoom._id,
  };

  // Create message
  const message = await Message.create(data);

  // Generate last message content safely
  let lastMessageContent = payload.meetingLink
    ? "🔗 Meeting Link"
    : payload.media
    ? getFileType(payload.media) || "📁 Media"
    : payload.message || "";

  // Prepare update fields
  let updateFields: any = {
    lastMessageTimestamp: message.createdAt,
    lastMessage: lastMessageContent,
  };

  // Update unseen counts correctly
  const recipientInChat = userInChat.get(payload.recipient.toString());

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

  // Update conversation with new last message and unseen count
  await Convirsation.findByIdAndUpdate(checkRoom._id, updateFields, { new: true });

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
  console.log(messages[0].room, "check room");

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
import mongoose from "mongoose";

const getConversationLists = async (id: string) => {
  // Convert id to ObjectId for correct MongoDB query
  const objectId = new mongoose.Types.ObjectId(id);

  // Find conversations where the user is either user1 or user2
  const conversations = await Convirsation.find({
    $or: [{ user1: objectId }, { user2: objectId }],
  })
    .populate("user1", "email name profileUrl _id")
    .populate("user2", "email name profileUrl _id")
    .sort({ lastMessageTimestamp: -1 });

  console.log(conversations, "check conversation list");

  // Map conversation data
  const conversationList = conversations.map((conversation: any) => {
    const isUser1 = conversation.user1._id.toString() === id.toString();
    const otherUser = isUser1 ? conversation.user2 : conversation.user1;
    const unseenMessageCount = isUser1
      ? conversation.user1UnseenCount
      : conversation.user2UnseenCount;

    return {
      id: otherUser._id,
      email: otherUser.email,
      name: otherUser.name
        ? `${otherUser.name.firstName?.trim() || ""} ${otherUser.name.lastName?.trim() || ""}`
        : "Unknown",
      profileUrl: otherUser.profileUrl || null,
      isOnline: onlineUsers.get(otherUser._id.toString()) || false,
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
const getFileType = (mediaUrl: string) => {
  const extension = mediaUrl.split(".").pop()?.toLowerCase();

  if (!extension) return "📁 File"; // Default case

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
    return "📷 Image";
  } else if (["pdf"].includes(extension)) {
    return "📄 PDF";
  } else if (["mp4", "mov", "avi", "mkv"].includes(extension)) {
    return "🎥 Video";
  } else if (["mp3", "wav", "ogg"].includes(extension)) {
    return "🎵 Audio";
  } else if (["doc", "docx"].includes(extension)) {
    return "📝 Document";
  } else {
    return "📁 File"; // General file
  }
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
