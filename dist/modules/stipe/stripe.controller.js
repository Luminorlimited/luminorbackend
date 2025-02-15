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
const auth_model_1 = require("../auth/auth.model");
const handleApiError_1 = __importDefault(require("../../errors/handleApiError"));
const stripe = new stripe_1.default(config_1.default.stripe.secretKey, {
    apiVersion: "2024-11-20.acacia",
});
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
const refundPaymentToCustomer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stripe_service_1.StripeServices.refundPaymentToCustomer(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Refund payment successfully",
        data: result,
    });
}));
const createPaymentIntent = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const files = req.files;
    let mergedPDFUrl;
    if (files || files.length === 0) {
        mergedPDFUrl = yield (0, generateClientRequirementPdf_1.mergePDFs)(files, req.body.caption, req.body.additionalMessage);
    }
    else {
        mergedPDFUrl = yield (0, generateClientRequirementPdf_1.mergePDFs)([], req.body.caption, req.body.additionalMessage);
    }
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
    switch (event.type) {
        case "account.updated":
            const account = event.data.object;
            if (account.charges_enabled &&
                account.details_submitted &&
                account.payouts_enabled) {
                yield professional_service_1.RetireProfessionalService.updateProfessionalStripeAccount(account);
            }
            else {
            }
            break;
        case "capability.updated":
            break;
        case "financial_connections.account.created":
            break;
        case "account.application.authorized":
            break;
        case "customer.created":
            break;
        case "account.external_account.created":
        default:
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
const getStripeCardLists = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield stripe_service_1.StripeServices.getStripeCardLists(req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "get stripe card   successfully",
        data: result,
    });
}));
const createStripeCard = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const paymentMethodId = req.body.paymentMethodId;
    const user = req.user;
    const result = yield stripe_service_1.StripeServices.createStripeCard(user.id, paymentMethodId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "create stripe card   successfully",
        data: result,
    });
}));
const generateAccountLink = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const dbUser = yield auth_model_1.User.findById(user.id);
    if (!dbUser) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "user not found");
    }
    const result = yield stripe_service_1.StripeServices.generateNewAccountLink(dbUser);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "A Onboarding Url has been send to your gmail.please complete your onboarding",
        data: result,
    });
}));
exports.StripeController = {
    getCustomerSavedCards,
    deleteCardFromCustomer,
    refundPaymentToCustomer,
    createPaymentIntent,
    handleWebHook,
    deliverProject,
    getStripeCardLists,
    createStripeCard,
    generateAccountLink
};
