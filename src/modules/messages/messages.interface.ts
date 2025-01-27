import mongoose from "mongoose";

export type IMessage = {
  sender: string;

  recipient: string;

  message?: string;
  media?: string;
  meetingLink?: string;
  room:mongoose.Types.ObjectId

};
