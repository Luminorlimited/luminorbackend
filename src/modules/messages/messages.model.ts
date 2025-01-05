import { Schema, model } from "mongoose";
import { IMessage } from "./messages.interface";

const messageSchema = new Schema<IMessage>(
  {
   
    sender: {
      type: String,
      required: true,
    },

    recipient: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      defaul: null,
    },
    media:{
      type:String,
      default:null
    }
  },
  
  {
    timestamps: true,
    versionKey:false
  }
);

export const Message = model("Message", messageSchema);