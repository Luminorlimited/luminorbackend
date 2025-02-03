import mongoose from "mongoose";

export type Iconvirsation = {
  user1: mongoose.Types.ObjectId;

  user2: mongoose.Types.ObjectId;
  lastMessageTimestamp: Date;
  lastMessage: String;
  user1UnseenCount: Number;
  user1UnseenMessages: mongoose.Types.ObjectId[];
  user2UnseenMessages: mongoose.Types.ObjectId[];
  user2UnseenCount: Number;
};
