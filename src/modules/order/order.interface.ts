import mongoose from "mongoose";
export type IRevision = {
  requestedBy: mongoose.Types.ObjectId; 
  revisionNumber: number;
  description: string;
  createdAt: Date;
};
export type IOrder = {
  clientRequerment: string;
  orderFrom: mongoose.Types.ObjectId;
  orderReciver: mongoose.Types.ObjectId;
  deliveryDate: string;
  totalPrice: string;
  project: mongoose.Types.ObjectId;
  paymentIntentId: string;
  transaction: mongoose.Types.ObjectId;
  revision:IRevision
};
