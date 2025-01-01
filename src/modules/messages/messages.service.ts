import { IMessage } from "./messages.interface";
import { Message } from "./messages.model";

const createMessage = async (payload: IMessage) => {
  const result = await Message.create(payload);
  return result;
};
const getMessages = async (senderId: string, recipientId: string) => {
  const messages = await Message.find({
    $or: [
      { sender: senderId, recipient: recipientId },
      { sender: recipientId, recipient: senderId },
    ],
  }).sort({ createdAt: 1 });

  return messages;
};
const getConversationLists = async (user: any) => {
  const conversations = await Message.aggregate([
    { $match: { $or: [{ sender: user.email }, { recipient: user.email }] } },
    {
      $group: {
        _id: {
          participant: {
            $cond: [
              { $ne: ["$sender", user.email] },
              "$sender",
              "$recipient",
            ],
          },
        },
        lastInteraction: { $max: "$createdAt" },
      },
    },
    { $sort: { lastInteraction: -1 } },
    {
      $lookup: {
        from: "RetireProfessionals",
        localField: "_id.participant",
        foreignField: "retireProfessional",
        as: "retireProfessionalDetails"
      }
    },
    {
      $lookup: {
        from: "Clients",
        localField: "_id.participant",
        foreignField: "client",
        as: "clientDetails"
      }
    },
    { $unwind: { path: "$retireProfessionalDetails", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$clientDetails", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        participant: {
          $cond: {
            if: { $gt: [{ $size: "$retireProfessionalDetails" }, 0] },
            then: "$retireProfessionalDetails",
            else: "$clientDetails"
          }
        },
        lastInteraction: 1,
      },
    },
  ]);

  return conversations;
};

export const MessageService = {
  createMessage,
  getMessages,
  getConversationLists
};