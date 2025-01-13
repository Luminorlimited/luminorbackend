import mongoose, { model } from "mongoose";
import { IOrder } from "./order.interface";

const orderSchema = new mongoose.Schema<IOrder>({
  clientRequerment: {
    type: String,
    required: true,
  },
  orderFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orderReciver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  deliveryData: {
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
});

export const Order = model<IOrder>("Order", orderSchema);
// userSchema.set("autoIndex", true);
