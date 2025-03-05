import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/handleApiError";
import { User } from "../auth/auth.model";
import { AgreementType, IOffer } from "./offer.interface";
import { Offer } from "./offer.model";
import { StripeServices } from "../stipe/stripe.service";
import Stripe from "stripe";
import config from "../../config";
import { RetireProfessionalService } from "../professional/professional.service";
import { MessageService } from "../messages/messages.service";
import { Message } from "../messages/messages.model";
import { users } from "../../socket";
import { io } from "../../server";
import mongoose from "mongoose";
const stripe = new Stripe(config.stripe.secretKey as string, {
  apiVersion: "2025-01-27.acacia",
});
const createOffer = async (offer: IOffer) => {
  // console.log(offer,"check create offer")
  // console.log(offer.professionalEmail,"check professional email")
  const professional = await User.findById(offer.professionalEmail);
  console.log(professional,"check professional")
  let stripeAccount;
  if (!professional?.isActivated) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "your account is not activate yet"
    );
  }
  if (professional?.stripe?.customerId) {
    stripeAccount = await stripe.accounts.retrieve(
      professional.stripe.customerId
    );

    if (!stripeAccount.details_submitted || !stripeAccount.charges_enabled) {
      await StripeServices.generateNewAccountLink(professional);
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "We sent you an onboarding URL. Please check your email."
      );
    }
  }

  await RetireProfessionalService.updateProfessionalStripeAccount(
    stripeAccount
  );
  offer.serviceFee = parseFloat(offer.totalPrice.toString()) * 0.2;
  offer.totalReceive = parseFloat(offer.totalPrice.toString());
  offer.totalPrice =
    parseFloat(offer.totalPrice.toString()) +
    parseFloat(offer.serviceFee.toString());

  if (offer.agreementType === AgreementType.FlatFee) {
    offer.totalDeliveryTime = offer.flatFee?.delivery
      ? parseFloat(offer.flatFee.delivery.toString())
      : 0;
  } else if (offer.agreementType === AgreementType.HourlyFee) {
    offer.totalDeliveryTime = offer.hourlyFee
      ? parseFloat(offer.hourlyFee.delivery.toString()) || 0
      : 0;
  } else if (
    offer.agreementType === AgreementType.Milestone &&
    offer.milestones
  ) {
    offer.totalDeliveryTime = offer?.milestones.reduce(
      (total, milestone) =>
        parseFloat(total.toString()) +
        (parseFloat(milestone.delivery.toString()) || 0),
      0
    );
  }
  const newOffer = await Offer.create(offer);
  const unseenCount = await Offer.countDocuments({
    clientEmail: offer.clientEmail,
    isSeen: false,
  });
  const result = await Offer.findByIdAndUpdate(
    newOffer._id,
    { count: unseenCount },
    { new: true }
  );

  return result;
};

const getOffersByProfessional = async (email: string) => {
  // Fetch offers sorted by latest createdAt (descending order)
  const offers = await Offer.find({ clientEmail: email }).sort({
    createdAt: -1,
  }); // Sorting in descending order

  const offersWithUserInfo = await Promise.all(
    offers.map(async (offer) => {
      const professionalInfo = await User.findOne({
        email: offer.professionalEmail,
      }).select("name.firstName name.lastName email");

      return {
        ...offer.toObject(),
        pofessionalInfo: professionalInfo || null,
      };
    })
  );

  const count = await countOffer(email);

  return {
    success: true,
    statusCode: 200,
    message: "Retrieve Professional Offers successfully",
    data: { offersWithUserInfo, count },
  };
};

const getSingleOffer = async (id: string) => {
  const offer = await Offer.findByIdAndUpdate(id, { isSeen: true })
    .populate("clientEmail", "name")
    .populate("professionalEmail", "name");
  if (!offer) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "offer not found");
  }

  return {
    offer,
    client: offer.clientEmail,
    retireProfessional: offer.professionalEmail,
  };
};
const deleteSingleOffer = async (id: string) => {
  const offer = await Offer.findByIdAndDelete({ _id: id });
  const messageContent = `Your Offer Canceled!`;
  const senderId = offer?.clientEmail as mongoose.Types.ObjectId; 
  const recipientId = offer?.professionalEmail as mongoose.Types.ObjectId; 

  
  const savedMessage = await MessageService.createMessage({
    sender: senderId,
    message: messageContent,
    recipient: recipientId,
    isUnseen: true,
  });


  const populatedMessage = await Message.findById(savedMessage._id)
    .populate({ path: "sender", select: "name email _id" })
    .populate({ path: "recipient", select: "name email _id" })
    .lean();

  const toSocketId = users[recipientId.toString()];

  
  if (toSocketId) {
    io.to(toSocketId).emit("privateMessage", {
      message: populatedMessage,
      fromUserId: senderId,
      toUserId: recipientId,
    });
  }
  return offer;
};
const countOffer = async (email: string) => {
  const totalUnseen = await Offer.find({
    clientEmail: email,
    isSeen: false,
  }).select("_id");
  return totalUnseen.length;
};
const getAllOffers = async () => {
  const result = await Offer.find({})
    .populate("professionalEmail")
    .populate("clientEmail");
  return result;
};
export const OfferService = {
  createOffer,
  getOffersByProfessional,
  getSingleOffer,
  deleteSingleOffer,
  countOffer,
  getAllOffers,
};
