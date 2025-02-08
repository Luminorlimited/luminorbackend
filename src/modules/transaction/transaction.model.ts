import mongoose, { Schema, model } from "mongoose";
import { ITransaction, PAYMENTSTATUS } from "./transaction.interface";

const transactionSchema = new mongoose.Schema<ITransaction>({
    orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: false,
  },
  amount: {
    type: Number,
    required: true,
  },
 
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENTSTATUS) ,
    required: true,
   
  },
  charge:{
    type:Number,
    required:true
  }
  
 

},{
  timestamps:true,
  versionKey:false
});

export const Transaction = model<ITransaction>("Transaction", transactionSchema);
