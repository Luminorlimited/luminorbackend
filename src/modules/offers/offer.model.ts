import mongoose from "mongoose";
import { AgreementType, IMilestone, IOffer } from "./offer.interface";

const milestoneSchema = new mongoose.Schema<IMilestone>({
  title: { type: String },
  description: { type: String },
  price: { type: Number },
  revision: { type: Number },
  delivery: { type: Number },
});

const offerSchema = new mongoose.Schema<IOffer>(
  {
    projectName: { type: String, required: true },
    description: { type: String, required: true },
    agreementType: {
      type: String,
      enum: Object.values(AgreementType),
      required: true,
    },
    flatFee: {
      revision: { type: Number },
      delivery: { type: Number },
      price: { type: Number },
    },
    hourlyFee: {
      revision: { type: Number },
      delivery: { type: Number },
      pricePerHour: { type: Number },
    },
    orderAgreementPDF: { type: String, required: true },
    milestones: [milestoneSchema],
    totalPrice: { type: Number, required: true },
    totalReceive: { type: Number, required: true },
    professionalEmail: { type: String, required: true },
    clientEmail: { type: String, required: true },
    totalDeliveryTime: {
      type: Number,
      required: true,
    },
    serviceFee: {
      type: Number,
      required: true,
    },

    isAccepted: { type: Boolean, default: false },
  },
  { timestamps: true ,versionKey:false}
);

export const Offer = mongoose.model<IOffer>("Offer", offerSchema);
