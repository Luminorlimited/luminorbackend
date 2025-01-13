import mongoose from "mongoose";

export type IOrder = {
  clientRequerment: string;
  orderFrom: mongoose.Types.ObjectId;
  orderReciver: mongoose.Types.ObjectId;
  deliveryData: string;
  totalPrice: string;
  project: mongoose.Types.ObjectId;
};
