import { Client } from "../client/client.model";
import { RetireProfessional } from "../professional/professional.model";
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
  console.log(user, "check user");
  const retireProfessional = await RetireProfessional.findOne(
    { relevantQualification: user.id },
    { _id: 1 }
  ).lean();

  const client = await Client.findOne(
    { client: user.id },
    { _id: 1 }
  ).lean();

  if (!retireProfessional && !client) {
    throw new Error("User not found in RetireProfessional or Client collections.");
  }

  const userId = retireProfessional ? retireProfessional._id : client._id;
  console.log(userId,"check user id")

  const messages = await Message.find({
    $or: [{ sender: user.email }, { recipient: user.email }],
  })
    // .populate({
    //   path: "sender",
    //   model: "RetireProfessional",
    //   select: "name email",
    //   match: { _id: { $ne: userId } }, 
    // })
    // .populate({
    //   path: "recipient",
    //   model: "Client",
    //   select: "name email", 
    //   match: { _id: { $ne: userId } },
    // })
    // .lean();
    console.log(messages,"check messages")


  const conversations = messages.map((message:any) => {
    const participant =
      message.sender && message.sender.email !== user.email
        ? message.sender
        : message.recipient;

    return {
      _id: message._id,
      participant,
      lastInteraction: message.createdAt,
    };
  });

  return messages;
};

export const MessageService = {
  createMessage,
  getMessages,
  getConversationLists
};