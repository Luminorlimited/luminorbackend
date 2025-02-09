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
exports.BraintreeService = void 0;
const http_status_codes_1 = require("http-status-codes");
const handleApiError_1 = __importDefault(require("../../errors/handleApiError"));
const braintreeConfig_1 = require("../../utilitis/braintreeConfig");
const professional_model_1 = require("../professional/professional.model");
const generateClientToken = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield braintreeConfig_1.gateway.clientToken.generate({});
        return response;
    }
    catch (error) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, error.message);
    }
});
const processPayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount, nonce, professionalId } = payload;
        const professional = yield professional_model_1.RetireProfessional.findOne({
            retireProfessional: professionalId,
        });
        if (!professional) {
            throw new handleApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "professional not found");
        }
        const platformFee = (amount * 20) / 100;
        const payoutAmount = amount - platformFee;
        const result = yield braintreeConfig_1.gateway.transaction.sale({
            amount: payoutAmount.toString(),
            paymentMethodNonce: nonce,
            customer: {
                firstName: payload.firstName,
                lastName: payload.lastName,
            },
            options: { submitForSettlement: true },
        });
        if (!result.success) {
            throw new handleApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, result.message);
        }
    }
    catch (error) {
        console.error("Error processing payment:", error);
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, error.message);
    }
});
exports.BraintreeService = {
    generateClientToken,
    processPayment,
};
