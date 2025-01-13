"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gateway = void 0;
const braintree_1 = __importDefault(require("braintree"));
const config_1 = __importDefault(require("../config"));
exports.gateway = new braintree_1.default.BraintreeGateway({
    environment: braintree_1.default.Environment.Sandbox,
    merchantId: config_1.default.braintree.merchantId || "defaultMerchantId",
    publicKey: config_1.default.braintree.publicKey || "defaultPublicKey",
    privateKey: config_1.default.braintree.privateKey || "defaultPrivateKey"
});
