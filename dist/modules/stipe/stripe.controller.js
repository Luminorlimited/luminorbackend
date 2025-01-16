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
exports.StripeController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const stripe_service_1 = require("./stripe.service");
const config_1 = __importDefault(require("../../config"));
const stripe_1 = __importDefault(require("stripe"));
const professional_service_1 = require("../professional/professional.service");
const generateClientRequirementPdf_1 = require("../../utilitis/generateClientRequirementPdf");
const stripe = new stripe_1.default(config_1.default.stripe.secretKey, {
    apiVersion: "2024-11-20.acacia",
});
// const saveCardWithCustomerInfo = catchAsync(async (req: any, res: any) => {
//   const userId = req.user.id;
//   const result = await StripeServices.saveCardWithCustomerInfoIntoStripe(
//     req.body,
//     userId
//   );
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Create customer and save card successfully",
//     data: result,
//   });
// });
// Authorize the customer with the amount and send payment request
// const authorizedPaymentWithSaveCard = catchAsync(async (req: any, res: any) => {
//   const result = await StripeServices.authorizedPaymentWithSaveCardFromStripe(
//     req.body
//   );
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Authorized customer and payment request successfully",
//     data: result,
//   });
// });
// Capture the payment request and deduct the amount
// const capturePaymentRequest = catchAsync(async (req: any, res: any) => {
//   const result = await StripeServices.capturePaymentRequestToStripe(req.body);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Capture payment request and payment deduct successfully",
//     data: result,
//   });
// });
// Save new card to existing customer
// const saveNewCardWithExistingCustomer = catchAsync(
//   async (req: any, res: any) => {
//     const result =
//       await StripeServices.saveNewCardWithExistingCustomerIntoStripe(req.body);
//     sendResponse(res, {
//       statusCode: 200,
//       success: true,
//       message: "New card save successfully",
//       data: result,
//     });
//   }
// );
// Get all save cards for customer
const getCustomerSavedCards = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield stripe_service_1.StripeServices.getCustomerSavedCardsFromStripe((_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.customerId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Retrieve customer cards successfully",
        data: result,
    });
}));
// Delete card from customer
const deleteCardFromCustomer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield stripe_service_1.StripeServices.deleteCardFromCustomer((_a = req.params) === null || _a === void 0 ? void 0 : _a.paymentMethodId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Delete a card successfully",
        data: result,
    });
}));
// Refund payment to customer
const refundPaymentToCustomer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stripe_service_1.StripeServices.refundPaymentToCustomer(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Refund payment successfully",
        data: result,
    });
}));
//payment from owner to rider
const createPaymentIntent = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const files = req.files;
    console.log(req.files);
    if (!files || files.length === 0) {
        throw new Error("No files uploaded.");
    }
    const mergedPDFUrl = yield (0, generateClientRequirementPdf_1.mergePDFs)(files, req.body.caption, req.body.additionalMessage);
    console.log(mergedPDFUrl, "chec merge url");
    const order = req.body;
    order.clientRequerment = mergedPDFUrl;
    const result = yield stripe_service_1.StripeServices.createPaymentIntentService(order);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Stipe payment successful",
        data: result,
    });
}));
const handleWebHook = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sig = req.headers["stripe-signature"];
    console.log(sig);
    if (!sig) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "Missing Stripe signature header.",
            data: null,
        });
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, config_1.default.stripe.webhookSecret);
    }
    catch (err) {
        console.error("Webhook signature verification failed.", err);
        return res.status(400).send("Webhook Error");
    }
    // Handle the event types
    switch (event.type) {
        case "account.updated":
            const account = event.data.object;
            console.log(account, "check account from webhook");
            if (account.charges_enabled &&
                account.details_submitted &&
                account.payouts_enabled) {
                console.log("Onboarding completed successfully for account:", account.id);
                yield professional_service_1.RetireProfessionalService.updateProfessionalStripeAccount(account);
            }
            else {
                console.log("Onboarding incomplete for account:", account.id);
            }
            break;
        case "capability.updated":
            console.log("Capability updated event received. Handle accordingly.");
            break;
        case "financial_connections.account.created":
            console.log("Financial connections account created event received. Handle accordingly.");
            break;
        case "account.application.authorized":
            const authorizedAccount = event.data.object;
            console.log("Application authorized for account:", authorizedAccount.id);
            // Add your logic to handle this event
            break;
        case "customer.created":
            const customer = event.data.object;
            console.log("New customer created:", customer.id);
            break;
        case "account.external_account.created":
            const externalAccount = event.data.object;
            console.log("External account created:", externalAccount);
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
    res.status(200).send("Event received");
}));
const deliverProject = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stripe_service_1.StripeServices.deliverProject(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "project deliver successfully",
        data: result,
    });
}));
exports.StripeController = {
    // saveCardWithCustomerInfo,
    // authorizedPaymentWithSaveCard,
    // capturePaymentRequest,
    // saveNewCardWithExistingCustomer,
    getCustomerSavedCards,
    deleteCardFromCustomer,
    refundPaymentToCustomer,
    createPaymentIntent,
    handleWebHook,
    deliverProject
};
