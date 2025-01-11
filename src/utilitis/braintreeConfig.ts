import braintree  from "braintree";
import config from "../config";

export const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: config.braintree.merchantId || "defaultMerchantId",
  publicKey: config.braintree.publicKey || "defaultPublicKey",
  privateKey: config.braintree.privateKey || "defaultPrivateKey"
});

