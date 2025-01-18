import { float } from "aws-sdk/clients/cloudfront";
import mongoose from "mongoose";


export type ITransaction = {
  customerId: string;

  orderId: mongoose.Types.ObjectId;
  paymentMethod:string;
  amount:number
  paymentStatus:PAYMENTSTATUS

}

export enum PAYMENTSTATUS {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED="refunded"
}

