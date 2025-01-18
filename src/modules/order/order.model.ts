import mongoose, { model } from "mongoose";
import { IOrder } from "./order.interface";

const orderSchema = new mongoose.Schema<IOrder>({
  clientRequerment: {
    type: String,
    required: true,
  },
  orderFrom: {
    type: String,

    required: true,
  },
  orderReciver: {
    type: String,

    required: true,
  },
  deliveryDate: {
    type: String,
    required: true,
  },
  totalPrice: {
    type: String,
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer",
    required: true,
  },
  paymentIntentId: {
    type: String,
    required: true,
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction", 
    required: true,
  },
  
});

export const Order = model<IOrder>("Order", orderSchema);
// userSchema.set("autoIndex", true);
