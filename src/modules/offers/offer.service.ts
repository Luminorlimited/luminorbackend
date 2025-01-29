import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/handleApiError";
import { calculateTotalPrice } from "../../utilitis/calculateTotalPrice";
import { User } from "../auth/auth.model";
import { AgreementType, IOffer } from "./offer.interface";
import { Offer } from "./offer.model";
import { INotification } from "../notification/notification.interface";
import {
  ENUM_NOTIFICATION_STATUS,
  ENUM_NOTIFICATION_TYPE,
} from "../../enums/notificationStatus";

import { Notification } from "../notification/notification.model";

const createOffer = async (offer: IOffer) => {
  const totalPrice = calculateTotalPrice(offer);

  offer.serviceFee = offer.totalPrice * 0.2;
  offer.totalPrice = totalPrice + offer.serviceFee;
  offer.totalReceive = totalPrice;

  if (offer.agreementType === AgreementType.FlatFee) {
    offer.totalDeliveryTime = offer.flatFee?.delivery || 0;
  } else if (offer.agreementType === AgreementType.HourlyFee) {
    offer.totalDeliveryTime = offer.hourlyFee?.delivery || 0;
  } else if (
    offer.agreementType === AgreementType.Milestone &&
    offer.milestones
  ) {
    offer.totalDeliveryTime = offer?.milestones.reduce(
      (total, milestone) => total + (milestone.delivery || 0),
      0
    );
  }

  const newOffer = await Offer.create(offer);

  return newOffer;
};

// const getOffersByProfessional = async (email: string) => {
//   const offer = await Offer.find({ clientEmail: email });

//   return offer;
// };
const getOffersByProfessional = async (email: string) => {
  const offers = await Offer.find({ clientEmail: email });

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

  return {
    success: true,
    statusCode: 200,
    message: "Retrieve Professional Offers successfully",
    data: offersWithUserInfo,
  };
};
const getSingleOffer = async (id: string) => {
  const offer = await Offer.findById(id);
  if (!offer) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "offer not found");
  }
  const [client, retireProfessional] = await Promise.all([
    User.findOne({ email: offer.clientEmail }).select("name "),
    User.findOne({ email: offer.professionalEmail }).select("name "),
  ]);

  // console.log(offer, "offer");
  return { offer, client, retireProfessional };
};
const deleteSingleOffer = async (id: string) => {
  const offer = await Offer.findByIdAndDelete({ _id: id });
  // console.log(offer, "offer");
  return offer;
};

const countOffer = async (email: string) => {
  console.log(email, "chcekc email");
  const totalUnseen = await Notification.find({
    recipient: email,
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
    type: ENUM_NOTIFICATION_TYPE.OFFER,
  }).select("_id");
  const filterIds = totalUnseen.map((offer) => offer._id.toString());
  // console.log(filterIds,"check filter id")

  return { count: totalUnseen.length, totalUnseenId: filterIds };
};
export const OfferService = {
  createOffer,
  getOffersByProfessional,
  getSingleOffer,
  deleteSingleOffer,
  countOffer,
};
