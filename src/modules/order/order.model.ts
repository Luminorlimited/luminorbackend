import mongoose, { model } from "mongoose";
import { IOrder, IRevision } from "./order.interface";
const revisionSchema = new mongoose.Schema<IRevision>(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timeLength:Date,
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);
const orderSchema = new mongoose.Schema<IOrder>(
  {
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
    revision: {
      type:[revisionSchema],
      default:[]
    },
    revisionCount:{
      type:Number,
      default:0
    },

    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Order = model<IOrder>("Order", orderSchema);
// userSchema.set("autoIndex", true);
