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
exports.StripeServices = void 0;
const stripe_1 = __importDefault(require("stripe"));
const auth_model_1 = require("../auth/auth.model");
const config_1 = __importDefault(require("../../config"));
const handleApiError_1 = __importDefault(require("../../errors/handleApiError"));
const http_status_codes_1 = require("http-status-codes");
const order_model_1 = require("../order/order.model");
const offer_service_1 = require("../offers/offer.service");
const order_service_1 = require("../order/order.service");
const transaction_model_1 = require("../transaction/transaction.model");
const mongoose_1 = __importDefault(require("mongoose"));
const transaction_interface_1 = require("../transaction/transaction.interface");
const offer_model_1 = require("../offers/offer.model");
const emailSender_1 = __importDefault(require("../../utilitis/emailSender"));
const stripe = new stripe_1.default(config_1.default.stripe_key, {
    apiVersion: "2024-11-20.acacia",
});
const getCustomerSavedCardsFromStripe = (customerId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentMethods = yield stripe.paymentMethods.list({
            customer: customerId,
            type: "card",
        });
        return { paymentMethods: paymentMethods.data };
    }
    catch (error) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, error.message);
    }
});
const deleteCardFromCustomer = (paymentMethodId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield stripe.paymentMethods.detach(paymentMethodId);
        return { message: "Card deleted successfully" };
    }
    catch (error) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, error.message);
    }
});
const refundPaymentToCustomer = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refund = yield stripe.refunds.create({
            payment_intent: payload === null || payload === void 0 ? void 0 : payload.paymentIntentId,
        });
        return refund;
    }
    catch (error) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, error.message);
    }
});
const createPaymentIntentService = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { offer } = yield offer_service_1.OfferService.getSingleOffer(payload.offerId);
    if (!offer) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Offer not found");
    }
    yield stripe.paymentMethods.attach(payload.paymentMethodId, {
        customer: payload.customerId,
    });
    const paymentMethodDetails = yield stripe.paymentMethods.retrieve(payload.paymentMethodId);
    if (paymentMethodDetails.customer !== payload.customerId) {
        throw new Error("PaymentMethod does not belong to this customer.");
    }
    const paymentIntent = yield stripe.paymentIntents.create({
        amount: offer.totalPrice * 100,
        currency: "usd",
        customer: payload.customerId,
        payment_method: payload.paymentMethodId,
        confirm: true,
        setup_future_usage: "on_session",
        automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
        },
    });
    if (paymentIntent.status !== "succeeded") {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "PaymentIntent was not successful");
    }
    const session = yield mongoose_1.default.startSession();
    let orderResult;
    try {
        session.startTransaction();
        const transaction = yield transaction_model_1.Transaction.create([
            {
                orderId: null,
                amount: offer.totalPrice,
                charge: offer.serviceFee,
                paymentStatus: "pending",
                stripePaymentIntentId: paymentIntent.id,
            },
        ], { session });
        const order = {
            clientRequerment: payload.clientRequerment,
            orderFrom: offer.clientEmail,
            orderReciver: offer.professionalEmail,
            deliveryDate: offer.totalDeliveryTime,
            totalPrice: offer.totalPrice,
            project: payload.offerId,
            paymentIntentId: paymentIntent.id,
            transaction: transaction[0]._id,
        };
        orderResult = yield order_model_1.Order.create([order], { session });
        yield transaction_model_1.Transaction.updateOne({ _id: transaction[0]._id }, { orderId: orderResult[0]._id }, { session });
        yield offer_model_1.Offer.deleteOne({ id: offer.id }), { session };
        yield session.commitTransaction();
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
    return orderResult[0];
});
const handleAccountUpdated = (event) => __awaiter(void 0, void 0, void 0, function* () {
});
const deliverProject = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const order = yield order_service_1.OrderService.getOrderById(orderId);
    if (!order || !order.result) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "order not found");
    }
    const retireProfessional = yield auth_model_1.User.findOne({
        _id: order === null || order === void 0 ? void 0 : order.result.orderReciver,
    });
    if (!retireProfessional) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "user not found");
    }
    if (!order) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "order not found");
    }
    const totalAmount = Math.round(parseFloat(order === null || order === void 0 ? void 0 : order.result.totalPrice) * 100);
    const platformFee = Math.round((parseFloat(order.result.totalPrice) * 20) / 100) * 100;
    const transferAmount = totalAmount - platformFee;
    const transfer = yield stripe.transfers.create({
        amount: transferAmount,
        currency: "usd",
        destination: (_a = retireProfessional === null || retireProfessional === void 0 ? void 0 : retireProfessional.stripe) === null || _a === void 0 ? void 0 : _a.customerId,
        transfer_group: `DELIVERY_${order === null || order === void 0 ? void 0 : order.result.paymentIntentId}`,
    });
    const updateTransaction = yield transaction_model_1.Transaction.findOneAndUpdate({ _id: order.result.transaction }, { $set: { paymentStatus: transaction_interface_1.PAYMENTSTATUS.COMPLETED } }, { new: true });
    return { transfer, updateTransaction };
});
const generateNewAccountLink = (user) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const accountLink = yield stripe.accountLinks.create({
        account: (_a = user.stripe) === null || _a === void 0 ? void 0 : _a.customerId,
        refresh_url: "https://your-platform.com/reauth",
        return_url: "https://luminoor.vercel.app",
        type: "account_onboarding",
    });
    const html = `
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333; border: 1px solid #ddd; border-radius: 10px;">
    <h2 style="color: #007bff; text-align: center;">Complete Your Onboarding</h2>
  
    <p>Dear <b>${user.name.firstName}</b>,</p>
  
    <p>We’re excited to have you onboard! To get started, please complete your onboarding process by clicking the link below:</p>
  
    <div style="text-align: center; margin: 20px 0;">
      <a href=${accountLink.url} style="background-color: #007bff; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
        Complete Onboarding
      </a>
    </div>
  
    <p>If the button above doesn’t work, you can also copy and paste this link into your browser:</p>
    <p style="word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 5px;">
      ${accountLink.url}
    </p>
  
    <p><b>Note:</b> This link is valid for a limited time. Please complete your onboarding as soon as possible.</p>
  
    <p>Thank you,</p>
    <p><b>The Support Team</b></p>
  
    <hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;">
    <p style="font-size: 12px; color: #777; text-align: center;">
      If you didn’t request this, please ignore this email or contact support.
    </p>
  </div>
  `;
    yield (0, emailSender_1.default)("Your Onboarding Url", user.email, html);
});
const isDuplicateStripecard = (paymentMethodId, stripeCustomerId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const paymentMethods = yield stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: "card",
    });
    const newCard = yield stripe.paymentMethods.retrieve(paymentMethodId);
    const duplicateCards = (_a = paymentMethods === null || paymentMethods === void 0 ? void 0 : paymentMethods.data) === null || _a === void 0 ? void 0 : _a.filter((existingCard) => existingCard.card.last4 === newCard.card.last4);
    return duplicateCards;
});
const createStripeCard = (id, paymentMethodId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(id, paymentMethodId);
    const user = yield auth_model_1.User.findById(id);
    console.log(user, "chekc  user");
    if (!user) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "user not found");
    }
    if (!((_a = user.stripe) === null || _a === void 0 ? void 0 : _a.customerId)) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Customer ID not found");
    }
    const existingCard = yield isDuplicateStripecard(paymentMethodId, user.stripe.customerId);
    if ((existingCard === null || existingCard === void 0 ? void 0 : existingCard.length) === 0) {
        const result = yield stripe.paymentMethods.attach(paymentMethodId, {
            customer: user.stripe.customerId,
        });
        return result;
    }
    else {
        throw new handleApiError_1.default(404, `The card you are trying to add is already linked to your account.`);
    }
});
const getStripeCardLists = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = yield auth_model_1.User.findById(id);
    console.log(user, "chekc  user");
    if (!user) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "user not found");
    }
    if (!((_a = user.stripe) === null || _a === void 0 ? void 0 : _a.customerId)) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Customer ID not found");
    }
    const result = yield stripe.paymentMethods.list({
        customer: (_b = user.stripe) === null || _b === void 0 ? void 0 : _b.customerId,
        type: "card",
    });
    return result;
});
exports.StripeServices = {
    getCustomerSavedCardsFromStripe,
    deleteCardFromCustomer,
    refundPaymentToCustomer,
    createPaymentIntentService,
    handleAccountUpdated,
    deliverProject,
    generateNewAccountLink,
    getStripeCardLists,
    createStripeCard,
};
