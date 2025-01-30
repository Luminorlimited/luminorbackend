import { StatusCodes } from "http-status-codes";
import {
  ENUM_NOTIFICATION_STATUS,
  ENUM_NOTIFICATION_TYPE,
} from "../../enums/notificationStatus";
import { ENUM_USER_ROLE } from "../../enums/user";
import ApiError from "../../errors/handleApiError";
import { onlineUsers } from "../../server";
import { uploadFileToSpace } from "../../utilitis/uploadTos3";
import { IUser } from "../auth/auth.interface";

import { User } from "../auth/auth.model";
import { Client } from "../client/client.model";
import { Convirsation } from "../convirsation/convirsation.model";
import { Notification } from "../notification/notification.model";
import { RetireProfessional } from "../professional/professional.model";
import { IMessage } from "./messages.interface";
import { Message } from "./messages.model";

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

  console.log(message,"check message")
  console.log(checkRoom._id,"check check room id")
 const result= await Convirsation.findByIdAndUpdate(
    checkRoom._id, // Conversation Room ID
    { lastMessageTimestamp: message.createdAt }, 
    { new: true }
  );
console.log(result,"update convirsation")
  return message;
};

const getMessages = async (senderId: string, recipientId: string) => {
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
  // console.log(messages[0].room,"check messages")
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

  const userDetails = [convirsationRoom.user1, convirsationRoom.user2].map(
    (user: any) => ({
      name: `${user.name.firstName} ${user.name.lastName}`,
      email: user.email,
      profileUrl: user.profileUrl || null,
    })
  );

  return { userDetails, messages };
};

const getConversationLists = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }


  const conversations = await Convirsation.find({
    $or: [{ user1: user._id }, { user2: user._id }],
  })
    .populate('user1', 'email name profileUrl _id')
    .populate('user2', 'email name profileUrl _id')
    .sort({ lastMessageTimestamp: -1 }); 

  const conversationList = await Promise.all(conversations.map(async (conversation: any) => {
    const otherUser = conversation.user1._id.toString() !== user._id.toString() ? conversation.user1 : conversation.user2;
    const count = await countMessageWithRecipient(otherUser.email, email);  

    return {
      id: otherUser._id,
      email: otherUser.email,
      name: `${otherUser.name.firstName.trim()} ${otherUser.name.lastName.trim()}`,
      profileUrl: otherUser.profileUrl || null,
      isOnline: onlineUsers.get(otherUser.email) || false,
      room: conversation._id,
      count, 
    };
  }));

  return conversationList;
};

// const getConversationLists = async (email: string) => {
//   const user = await User.findOne({ email });
//   if (!user) {
//     throw new ApiError(StatusCodes.NOT_FOUND, "user not found");
//   }

//   // Fetch conversations in one go
//   const conversationList = await Convirsation.find({
//     $or: [{ user1: user._id }, { user2: user._id }],
//   })
//     .populate("user1", "email name profileUrl")
//     .populate("user2", "email name profileUrl");

//   const otherUserEmails = conversationList.map(conversation =>
//     conversation.user1._id.toString() !== user.id
//       ? conversation.user1.email 
//       : conversation.user2.email
//   );

//   // Fetch all unread counts in a single query
//   const unreadCounts = await getUnreadMessageCounts(otherUserEmails, email); 

//   // Format conversation list
//   return conversationList.map(conversation => {
//     const otherUser =
//       conversation.user1._id.toString() !== user.id
//         ? conversation.user1
//         : conversation.user2;

//     return {
//       email: otherUser.email,
//       name: `${otherUser.name.firstName.trim()} ${otherUser.name.lastName.trim()}`,
//       profileUrl: otherUser.profileUrl || null,
//       isOnline: onlineUsers.get(otherUser.email) || false, 
//       count: unreadCounts[otherUser.email] || 0, // Use pre-fetched counts
//     };
//   });
// };


const uploadMessagefile = async (file: any) => {
  const fileUrl = await uploadFileToSpace(file, "message-file");
  return fileUrl;
};

const countMessages = async (email: string) => {
  console.log(email, "chcekc email");
  const totalUnseen = await Notification.find({
    recipient: email,
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
    type: ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE,
  }).select("_id");
  const filterIds = totalUnseen.map((message) => message._id.toString());
  // console.log(filterIds,"check filter id")

  return { count: totalUnseen.length, totalUnseenId: filterIds };
};
const countMessageWithRecipient=async(sender:string,recepient:string)=>{

  const totalUnseen=await Notification.find({
    sender:sender,
    recipient:recepient,
    status:ENUM_NOTIFICATION_STATUS.UNSEEN,
    type:ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE
  })
  const filterIds = totalUnseen.map((message) => message._id.toString());
  // console.log(filterIds,"check filter id")

  return { count: totalUnseen.length, totalUnseenId: filterIds };
}
const getUnreadMessageCounts = async (recipientEmails: string[], senderEmail: string) => {
  const unreadMessages = await Message.aggregate([
    { $match: { recipient: { $in: recipientEmails }, sender: senderEmail, isRead: false } },
    { $group: { _id: "$recipient", count: { $sum: 1 } } }
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
  countMessageWithRecipient
};
