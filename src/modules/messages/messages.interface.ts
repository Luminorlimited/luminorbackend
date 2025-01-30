import mongoose from "mongoose";

export type IMessage = {
  sender: mongoose.Types.ObjectId;

  recipient: mongoose.Types.ObjectId;

  message?: string;
  media?: string;
  meetingLink?: string;
  room?:mongoose.Types.ObjectId
  createdAt?: Date; 
  updatedAt?: Date;

};
