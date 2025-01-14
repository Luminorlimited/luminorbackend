import { calculateTotalPrice } from "../../utilitis/calculateTotalPrice";
import { User } from "../auth/auth.model";
import { AgreementType, IOffer } from "./offer.interface";
import { Offer } from "./offer.model";



  const createOffer = async (offer: IOffer) => {
  
    const totalPrice = calculateTotalPrice(offer);
  
 
    offer.serviceFee = offer.totalPrice * 0.2; 
    offer.totalPrice=totalPrice
    offer.totalReceive=totalPrice-(offer.totalPrice * 0.2)

   
    if (offer.agreementType === AgreementType.FlatFee) {
      offer.totalDeliveryTime = offer.flatFee?.delivery || 0;
    } else if (offer.agreementType === AgreementType.HourlyFee) {
      offer.totalDeliveryTime = offer.hourlyFee?.delivery || 0;
    } else if (offer.agreementType ===AgreementType.Milestone && offer.milestones) {
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
  let totalDeliverTime;

  const offersWithUserInfo = await Promise.all(
    offers.map(async (offer) => {
      const professionalInfo = await User.findOne({ email: offer.professionalEmail }).select(
        "name.firstName name.lastName email"
      );

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
  console.log(offer, "offer");
  return offer;
};
const deleteSingleOffer=async (id: string) => {
  const offer = await Offer.findByIdAndDelete({_id:id});
  console.log(offer, "offer");
  return offer;
};
export const OfferService = {
  createOffer,
  getOffersByProfessional,
  getSingleOffer,
  deleteSingleOffer
};
