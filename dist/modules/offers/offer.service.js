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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferService = void 0;
const http_status_codes_1 = require("http-status-codes");
const handleApiError_1 = __importDefault(require("../../errors/handleApiError"));
const auth_model_1 = require("../auth/auth.model");
const offer_interface_1 = require("./offer.interface");
const offer_model_1 = require("./offer.model");
const stripe_service_1 = require("../stipe/stripe.service");
const createOffer = (offer) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const professional = yield auth_model_1.User.findOne({ email: offer.professionalEmail });
    const client = yield auth_model_1.User.findOne({ email: offer.clientEmail });
    if (!client || !professional) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Client or Professional not found");
    }
    offer.clientEmail = client._id;
    offer.professionalEmail = professional._id;
    console.log(offer, "check offer from service file");
    if (((_a = professional === null || professional === void 0 ? void 0 : professional.stripe) === null || _a === void 0 ? void 0 : _a.isOnboardingSucess) === false) {
        yield stripe_service_1.StripeServices.generateNewAccountLink(professional);
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "we send you a onboaring url.please check your email");
    }
    offer.serviceFee = parseFloat(offer.totalPrice.toString()) * 0.2;
    offer.totalReceive = parseFloat(offer.totalPrice.toString());
    offer.totalPrice = parseFloat(offer.totalPrice.toString()) + parseFloat(offer.serviceFee.toString());
    if (offer.agreementType === offer_interface_1.AgreementType.FlatFee) {
        offer.totalDeliveryTime = ((_b = offer.flatFee) === null || _b === void 0 ? void 0 : _b.delivery) ? parseFloat(offer.flatFee.delivery.toString()) : 0;
    }
    else if (offer.agreementType === offer_interface_1.AgreementType.HourlyFee) {
        offer.totalDeliveryTime = offer.hourlyFee ? parseFloat(offer.hourlyFee.delivery.toString()) || 0 : 0;
    }
    else if (offer.agreementType === offer_interface_1.AgreementType.Milestone &&
        offer.milestones) {
        offer.totalDeliveryTime = offer === null || offer === void 0 ? void 0 : offer.milestones.reduce((total, milestone) => parseFloat(total.toString()) + (parseFloat(milestone.delivery.toString()) || 0), 0);
    }
    const newOffer = yield offer_model_1.Offer.create(offer);
    const unseenCount = yield offer_model_1.Offer.countDocuments({
        clientEmail: offer.clientEmail,
        isSeen: false,
    });
    const result = yield offer_model_1.Offer.findByIdAndUpdate(newOffer._id, { count: unseenCount }, { new: true });
    return result;
});
const getOffersByProfessional = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const offers = yield offer_model_1.Offer.find({ clientEmail: email });
    const offersWithUserInfo = yield Promise.all(offers.map((offer) => __awaiter(void 0, void 0, void 0, function* () {
        const professionalInfo = yield auth_model_1.User.findOne({
            email: offer.professionalEmail,
        }).select("name.firstName name.lastName email");
        return Object.assign(Object.assign({}, offer.toObject()), { pofessionalInfo: professionalInfo || null });
    })));
    const count = yield countOffer(email);
    return {
        success: true,
        statusCode: 200,
        message: "Retrieve Professional Offers successfully",
        data: { offersWithUserInfo, count },
    };
});
const getSingleOffer = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const offer = yield offer_model_1.Offer.findByIdAndUpdate(id, { isSeen: true });
    if (!offer) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "offer not found");
    }
    const [client, retireProfessional] = yield Promise.all([
        auth_model_1.User.findOne({ email: offer.clientEmail }).select("name "),
        auth_model_1.User.findOne({ email: offer.professionalEmail }).select("name "),
    ]);
    return { offer, client, retireProfessional };
});
const deleteSingleOffer = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const offer = yield offer_model_1.Offer.findByIdAndDelete({ _id: id });
    // console.log(offer, "offer");
    return offer;
});
const countOffer = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const totalUnseen = yield offer_model_1.Offer.find({
        clientEmail: email,
        isSeen: false
    }).select("_id");
    return totalUnseen.length;
});
const getAllOffers = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield offer_model_1.Offer.find({}).populate("professionalEmail").populate("clientEmail");
    return result;
});
exports.OfferService = {
    createOffer,
    getOffersByProfessional,
    getSingleOffer,
    deleteSingleOffer,
    countOffer,
    getAllOffers
};
