"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferService = void 0;
const calculateTotalPrice_1 = require("../../utilitis/calculateTotalPrice");
const auth_model_1 = require("../auth/auth.model");
const offer_interface_1 = require("./offer.interface");
const offer_model_1 = require("./offer.model");
const createOffer = (offer) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const totalPrice = (0, calculateTotalPrice_1.calculateTotalPrice)(offer);
    offer.serviceFee = offer.totalPrice * 0.2;
    offer.totalPrice = totalPrice;
    offer.totalReceive = totalPrice - (offer.totalPrice * 0.2);
    if (offer.agreementType === offer_interface_1.AgreementType.FlatFee) {
        offer.totalDeliveryTime = ((_a = offer.flatFee) === null || _a === void 0 ? void 0 : _a.delivery) || 0;
    }
    else if (offer.agreementType === offer_interface_1.AgreementType.HourlyFee) {
        offer.totalDeliveryTime = ((_b = offer.hourlyFee) === null || _b === void 0 ? void 0 : _b.delivery) || 0;
    }
    else if (offer.agreementType === offer_interface_1.AgreementType.Milestone && offer.milestones) {
        offer.totalDeliveryTime = offer === null || offer === void 0 ? void 0 : offer.milestones.reduce((total, milestone) => total + (milestone.delivery || 0), 0);
    }
    const newOffer = yield offer_model_1.Offer.create(offer);
    return newOffer;
});
// const getOffersByProfessional = async (email: string) => {
//   const offer = await Offer.find({ clientEmail: email });
//   return offer;
// };
const getOffersByProfessional = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const offers = yield offer_model_1.Offer.find({ clientEmail: email });
    let totalDeliverTime;
    const offersWithUserInfo = yield Promise.all(offers.map((offer) => __awaiter(void 0, void 0, void 0, function* () {
        const professionalInfo = yield auth_model_1.User.findOne({ email: offer.professionalEmail }).select("name.firstName name.lastName email");
        return Object.assign(Object.assign({}, offer.toObject()), { pofessionalInfo: professionalInfo || null });
    })));
    return {
        success: true,
        statusCode: 200,
        message: "Retrieve Professional Offers successfully",
        data: offersWithUserInfo,
    };
});
const getSingleOffer = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const offer = yield offer_model_1.Offer.findById(id);
    console.log(offer, "offer");
    return offer;
});
const deleteSingleOffer = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const offer = yield offer_model_1.Offer.findByIdAndDelete({ _id: id });
    console.log(offer, "offer");
    return offer;
});
exports.OfferService = {
    createOffer,
    getOffersByProfessional,
    getSingleOffer,
    deleteSingleOffer
};
