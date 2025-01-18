import mongoose from "mongoose";

export type IOrder = {
  clientRequerment: string;
  orderFrom: string;
  orderReciver: string;
  deliveryDate: string;
  totalPrice: string;
  project: mongoose.Types.ObjectId;
  paymentIntentId: string;
  transaction: mongoose.Types.ObjectId;
};
