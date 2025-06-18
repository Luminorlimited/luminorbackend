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
import { NotificationService } from "../notification/notification.service";
import { INotification } from "../notification/notification.interface";
import {
  ENUM_NOTIFICATION_STATUS,
  ENUM_NOTIFICATION_TYPE,
} from "../../enums/notificationStatus";
const stripe = new Stripe(config.stripe.secretKey as string, {
  apiVersion: "2025-01-27.acacia",
});
const createOffer = async (offer: IOffer) => {
  const professional = await User.findById(offer.professionalEmail);

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

  const notificationData: INotification = {
    recipient: offer.clientEmail as mongoose.Types.ObjectId,
    sender: offer.professionalEmail as mongoose.Types.ObjectId,
    message: `You have received a new offer from ${
      professional.name.firstName + " " + professional.name.lastName
    }`,
    type: ENUM_NOTIFICATION_TYPE.OFFER,
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
  };

  await NotificationService.createNotification(
    notificationData,
    "sendNotification"
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
  // Delete the offer and populate client info
  const offer: any = await Offer.findByIdAndDelete(id)
    .populate("clientEmail")
    .populate("professionalEmail");
  if (!offer) throw new ApiError(StatusCodes.NOT_FOUND, "Offer not found");

  const messageContent = `Your offer has been declined, please speak to the retired professional`;
  const sender = offer.clientEmail;
  const recipient = offer.professionalEmail;

  const senderId = sender._id;
  const recipientId = recipient._id;

  const tempMessageId = new mongoose.Types.ObjectId();
  const toSocketId = users[recipientId.toString()];


  if (toSocketId) {
    io.to(toSocketId).emit("privateMessage", {
      message: {
        _id: tempMessageId,
        sender: { _id: senderId, name: sender.name, email: sender.email },
        recipient: {
          _id: recipientId,
          name: recipient.name,
          email: recipient.email,
        },
        message: messageContent,
        timestamp: new Date(),
        isUnseen: true,
        status: "pending",
      },
      fromUserId: senderId,
      toUserId: recipientId,
    });
  }

  const savedMessage = await MessageService.createMessage({
    _id: tempMessageId,
    sender: senderId,
    recipient: recipientId,
    message: messageContent,
    isUnseen: true,
  });

  // ✅ Create a notification
  const notificationData: INotification = {
    recipient: recipientId,
    sender: senderId,
    message: `${sender.name.firstName} ${sender.name.lastName} has canceled your offer`,
    type: ENUM_NOTIFICATION_TYPE.OFFER,
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
  };

  await NotificationService.createNotification(
    notificationData,
    "sendNotification"
  );

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
