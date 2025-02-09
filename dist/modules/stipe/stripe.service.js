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
// Initialize Stripe with your secret API key
const stripe = new stripe_1.default(config_1.default.stripe_key, {
    //   apiVersion: "2024-06-20",
    apiVersion: "2024-11-20.acacia",
});
// Step 1: Create a Customer and Save the Card
// const saveCardWithCustomerInfoIntoStripe = async (
//   payload: TStripeSaveWithCustomerInfo,
//   userId: string
// ) => {
//   try {
//     const { user, paymentMethodId, address } = payload;
//     // Create a new Stripe customer
//     const customer = await stripe.customers.create({
//       name: user.name,
//       email: user.email,
//       address: {
//         city: address.city,
//         postal_code: address.postal_code,
//         country: address.country,
//       },
//     });
//     // Attach PaymentMethod to the Customer
//     await stripe.paymentMethods.attach(paymentMethodId, {
//       customer: customer.id,
//     });
//     // Set PaymentMethod as Default
//     await stripe.customers.update(customer.id, {
//       invoice_settings: {
//         default_payment_method: paymentMethodId,
//       },
//     });
//     // update profile with customerId
//     await User.findByIdAndUpdate(
//       {
//         _id: userId,
//       },
//       {
//         customerId: customer.id,
//       }
//     );
//     return {
//       customerId: customer.id,
//       paymentMethodId: paymentMethodId,
//     };
//   } catch (error: any) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
//   }
// };
// Step 2: Authorize the Payment Using Saved Card
// const authorizedPaymentWithSaveCardFromStripe = async (payload: {
//   customerId: string;
//   amount: number;
//   paymentMethodId: string;
// }) => {
//   try {
//     const { customerId, amount, paymentMethodId } = payload;
//     if (!isValidAmount(amount)) {
//       throw new ApiError(
//         StatusCodes.BAD_REQUEST,
//         `Amount '${amount}' is not a valid amount`
//       );
//     }
//     // Create a PaymentIntent with the specified PaymentMethod
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: amount * 100, // Convert to cents
//       currency: "usd",
//       customer: customerId,
//       payment_method: paymentMethodId,
//       off_session: true,
//       confirm: true,
//       capture_method: "manual", // Authorize the payment without capturing
//     });
//     return paymentIntent;
//   } catch (error: any) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
//   }
// };
// Step 3: Capture the Payment
// const capturePaymentRequestToStripe = async (payload: {
//   paymentIntentId: string;
// }) => {
//   try {
//     const { paymentIntentId } = payload;
//     // Capture the authorized payment using the PaymentIntent ID
//     const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
//     return paymentIntent;
//   } catch (error: any) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
//   }
// };
// New Route: Save a New Card for Existing Customer
// const saveNewCardWithExistingCustomerIntoStripe = async (payload: {
//   customerId: string;
//   paymentMethodId: string;
// }) => {
//   try {
//     const { customerId, paymentMethodId } = payload;
//     // Attach the new PaymentMethod to the existing Customer
//     await stripe.paymentMethods.attach(paymentMethodId, {
//       customer: customerId,
//     });
//     // Optionally, set the new PaymentMethod as the default
//     await stripe.customers.update(customerId, {
//       invoice_settings: {
//         default_payment_method: paymentMethodId,
//       },
//     });
//     return {
//       customerId: customerId,
//       paymentMethodId: paymentMethodId,
//     };
//   } catch (error: any) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
//   }
// };
const getCustomerSavedCardsFromStripe = (customerId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // List all payment methods for the customer
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
// Delete a card from a customer in the stripe
const deleteCardFromCustomer = (paymentMethodId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield stripe.paymentMethods.detach(paymentMethodId);
        return { message: "Card deleted successfully" };
    }
    catch (error) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, error.message);
    }
});
// Refund amount to customer in the stripe
const refundPaymentToCustomer = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Refund the payment intent
        const refund = yield stripe.refunds.create({
            payment_intent: payload === null || payload === void 0 ? void 0 : payload.paymentIntentId,
        });
        return refund;
    }
    catch (error) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, error.message);
    }
});
//   // console.log(payload, "check payload");
//   if (!payload.amount) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, "Amount is required");
//   }
//   if (!isValidAmount(payload.amount)) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       `Amount '${payload.amount}' is not a valid amount`
//     );
//   }
//   // Create a PaymentIntent with Stripe
//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: payload.amount, // Total amount in cents
//     currency: "usd",
//     customer: payload.customerId,
//     payment_method: payload.paymentMethodId,
//     confirm: true,
//     setup_future_usage: "on_session",
//     // application_fee_amount: platformFee,
//     // transfer_data: {
//     //   destination: config.stripe.accountId as string,
//     //   // amount: retireProfessionalAmount, // Transfer amount in cents
//     // },
//     automatic_payment_methods: {
//       enabled: true,
//       allow_redirects: "never", // Disallow redirect-based methods
//     },
//   });
//   const offer = await OfferService.getSingleOffer(payload.offerId);
//   let orderResult;
//   if (offer && paymentIntent.status === "succeeded") {
//     const order = {
//       clientRequerment: payload.clientRequerment,
//       orderFrom: offer.clientEmail,
//       orderReciver: offer.professionalEmail,
//       deliveryDate: offer.totalDeliveryTime,
//       totalPrice: offer.totalPrice,
//       project: payload.offerId,
//       paymentIntentId: payload.paymentMethodId,
//     };
//     console.log(order, "check order");
//     orderResult = await Order.create(order);
//   }
//   return orderResult;
// };
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
const handleAccountUpdated = (event) => __awaiter(void 0, void 0, void 0, function* () { });
const deliverProject = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // console.log(orderId, "check orderId")
    const order = yield order_service_1.OrderService.getOrderById(orderId);
    // console.log(order, "check order")
    if (!order || !order.result) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "order not found");
    }
    const retireProfessional = yield auth_model_1.User.findOne({
        email: order === null || order === void 0 ? void 0 : order.result.orderReciver,
    });
    if (!retireProfessional) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "user not found");
    }
    // console.log(retireProfessional, "check retire professional");
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
    // console.lo
    const updateTransaction = yield transaction_model_1.Transaction.findOneAndUpdate({ _id: order.result.transaction }, { $set: { paymentStatus: transaction_interface_1.PAYMENTSTATUS.COMPLETED } }, { new: true });
    console.log(updateTransaction, "check update transaction");
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
exports.StripeServices = {
    // saveCardWithCustomerInfoIntoStripe,
    // authorizedPaymentWithSaveCardFromStripe,
    // capturePaymentRequestToStripe,
    // saveNewCardWithExistingCustomerIntoStripe,
    getCustomerSavedCardsFromStripe,
    deleteCardFromCustomer,
    refundPaymentToCustomer,
    createPaymentIntentService,
    handleAccountUpdated,
    deliverProject,
    generateNewAccountLink,
};
