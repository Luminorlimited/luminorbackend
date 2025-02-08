"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Offer = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const offer_interface_1 = require("./offer.interface");
const milestoneSchema = new mongoose_1.default.Schema({
    title: { type: String },
    description: { type: String },
    price: { type: Number },
    revision: { type: Number },
    delivery: { type: Number },
});
const offerSchema = new mongoose_1.default.Schema({
    projectName: { type: String, required: true },
    description: { type: String, required: true },
    agreementType: {
        type: String,
        enum: Object.values(offer_interface_1.AgreementType),
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
    professionalEmail: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    clientEmail: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    totalDeliveryTime: {
        type: Number,
        required: true,
    },
    serviceFee: {
        type: Number,
        required: true,
    },
    isSeen: {
        type: Boolean,
        default: false,
    },
    count: {
        type: Number,
    },
    isAccepted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });
exports.Offer = mongoose_1.default.model("Offer", offerSchema);
