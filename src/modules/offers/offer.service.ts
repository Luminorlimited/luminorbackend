import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/handleApiError";
import { User } from "../auth/auth.model";
import { AgreementType, IOffer } from "./offer.interface";
import { Offer } from "./offer.model";
import { StripeServices } from "../stipe/stripe.service";
import mongoose from "mongoose";
// const createOffer = async (offer: IOffer) => {
//   const professional = await User.findOne({ email: offer.professionalEmail });
//   const client = await User.findOne({ email: offer.clientEmail });
//   if (!client || !professional) {
//     throw new ApiError(
//       StatusCodes.NOT_FOUND,
//       "Client or Professional not found"
//     );
//   }
//   offer.clientEmail = client._id as mongoose.Types.ObjectId;
//   offer.professionalEmail = professional._id as mongoose.Types.ObjectId;
//   if (professional?.stripe?.isOnboardingSucess === false) {
//     await StripeServices.generateNewAccountLink(professional);
//     throw new ApiError(
//       StatusCodes.UNAUTHORIZED,
//       "we send you a onboaring url.please check your email"
//     );
//   }
//   offer.serviceFee = parseFloat(offer.totalPrice.toString()) * 0.2;
//   offer.totalReceive = parseFloat(offer.totalPrice.toString());
//   offer.totalPrice =
//     parseFloat(offer.totalPrice.toString()) +
//     parseFloat(offer.serviceFee.toString());

//   if (offer.agreementType === AgreementType.FlatFee) {
//     offer.totalDeliveryTime = offer.flatFee?.delivery
//       ? parseFloat(offer.flatFee.delivery.toString())
//       : 0;
//   } else if (offer.agreementType === AgreementType.HourlyFee) {
//     offer.totalDeliveryTime = offer.hourlyFee
//       ? parseFloat(offer.hourlyFee.delivery.toString()) || 0
//       : 0;
//   } else if (
//     offer.agreementType === AgreementType.Milestone &&
//     offer.milestones
//   ) {
//     offer.totalDeliveryTime = offer?.milestones.reduce(
//       (total, milestone) =>
//         parseFloat(total.toString()) +
//         (parseFloat(milestone.delivery.toString()) || 0),
//       0
//     );
//   }
//   const newOffer = await Offer.create(offer);
//   const unseenCount = await Offer.countDocuments({
//     clientEmail: offer.clientEmail,
//     isSeen: false,
//   });
//   const result = await Offer.findByIdAndUpdate(
//     newOffer._id,
//     { count: unseenCount },
//     { new: true }
//   );

//   return result;
// };
const createOffer = async (offer: IOffer) => {
  // const professional = await User.findOne({ email: offer.professionalEmail });
  // const client = await User.findOne({ email: offer.clientEmail });
  // if (!client || !professional) {
  //   throw new ApiError(
  //     StatusCodes.NOT_FOUND,
  //     "Client or Professional not found"
  //   );
  // }
  // offer.clientEmail = client._id as mongoose.Types.ObjectId;
  // offer.professionalEmail = professional._id as mongoose.Types.ObjectId;
  const professional = await User.findById(offer.professionalEmail);
  if (professional?.stripe?.isOnboardingSucess === false) {
    await StripeServices.generateNewAccountLink(professional);
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "we send you a onboaring url.please check your email"
    );
  }
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
  const offer = await Offer.findByIdAndUpdate(id, { isSeen: true });
  if (!offer) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "offer not found");
  }
  const [client, retireProfessional] = await Promise.all([
    User.findOne({ email: offer.clientEmail }).select("name "),
    User.findOne({ email: offer.professionalEmail }).select("name "),
  ]);
  return { offer, client, retireProfessional };
};
const deleteSingleOffer = async (id: string) => {
  const offer = await Offer.findByIdAndDelete({ _id: id });
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
