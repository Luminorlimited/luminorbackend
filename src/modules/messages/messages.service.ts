import { ENUM_USER_ROLE } from "../../enums/user";
import { onlineUsers } from "../../server";

import { User } from "../auth/auth.model";
import { Client } from "../client/client.model";
import { RetireProfessional } from "../professional/professional.model";
import { IMessage } from "./messages.interface";
import { Message } from "./messages.model";

const createMessage = async (payload: IMessage) => {
  const result = await Message.create(payload);
  return result;
};
const getMessages = async (senderId: string, recipientId: string) => {
  // console.log(senderId, recipientId);

  const messages = await Message.find({
    $or: [
      { sender: senderId, recipient: recipientId },
      { sender: recipientId, recipient: senderId },
      { sender: { $regex: `^${senderId}$`, $options: "i" } },
      { sender: { $regex: `^${recipientId}$`, $options: "i" } },
      { recipient: { $regex: `^${senderId}$`, $options: "i" } },
      { recipient: { $regex: `^${recipientId}$`, $options: "i" } },
    ],
  }).sort({ createdAt: 1 });

  // console.log(messages, "check messages");

  const emails = new Set<string>();
  messages.forEach((msg) => {
    emails.add(msg.sender);
    emails.add(msg.recipient);
  });

  const users = await User.find({ email: { $in: Array.from(emails) } }).select(
    "email name role"
  );

  const userDetails = await Promise.all(
    users.map(async (user) => {
      let profileUrl = null;

      if (user.role === ENUM_USER_ROLE.CLIENT) {
        const client = await Client.findOne({ client: user._id }).select(
          "profileUrl"
        );
        profileUrl = client?.profileUrl || null;
      } else if (user.role === ENUM_USER_ROLE.RETIREPROFESSIONAL) {
        const retireProfessional = await RetireProfessional.findOne({
          retireProfessional: user._id,
        }).select("profileUrl");
        profileUrl = retireProfessional?.profileUrl || null;
      }

      return {
        email: user.email,
        name: `${user.name.firstName} ${user.name.lastName}`,
        profileUrl,
        userId: user._id,
      };
    })
  );

  return { userDetails, messages };
};

const getConversationLists = async (user: any) => {
  try {
    // console.log(user.email, "check email");

    const messages = await Message.find({
      $or: [
        { sender: { $regex: `^${user.email}$`, $options: "i" } },
        { recipient: { $regex: `^${user.email}$`, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    // console.log(messages, "check messages");

    const emails = new Set<string>();
    messages.forEach((msg) => {
      emails.add(msg.sender);
      emails.add(msg.recipient);
    });
    emails.delete(user.email);
    const emailArray = Array.from(emails);
    // console.log(emailArray, "check emails");

    const users = await User.find({
      email: { $in: emailArray },
    }).select("email name role");

    const userMap = new Map(users.map((user) => [user.email, user]));

    const sortedUsers = emailArray
      .map((email) => userMap.get(email))
      .filter(Boolean);

    const userDetails = await Promise.all(
      sortedUsers.map(async (user: any) => {
        let profileUrl = null;

        if (user.role === ENUM_USER_ROLE.CLIENT) {
          const client = await Client.findOne({ client: user._id }).select(
            "profileUrl"
          );
          profileUrl = client?.profileUrl || null;
        } else if (user.role === ENUM_USER_ROLE.RETIREPROFESSIONAL) {
          const retireProfessional = await RetireProfessional.findOne({
            retireProfessional: user._id,
          }).select("profileUrl");
          profileUrl = retireProfessional?.profileUrl || null;
        }

        const isOnline = onlineUsers?.has(user.email);
        return {
          id: user._id,
          email: user.email,
          name: `${user.name.firstName} ${user.name.lastName}`,
          profileUrl,

          isOnline: isOnline || "false",
        };
      })
    );

    return userDetails;
  } catch (error) {
    console.error("Error fetching conversation list:", error);
    throw error;
  }
};
// Import the `isOnline` function from your server file

export const MessageService = {
  createMessage,
  getMessages,
  getConversationLists,
};
