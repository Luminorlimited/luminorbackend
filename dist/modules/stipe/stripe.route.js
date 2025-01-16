"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeRoutes = void 0;
const express_1 = __importDefault(require("express"));
const stripe_controller_1 = require("./stripe.controller");
const multer_1 = require("../../middlewares/multer");
const parseJson_1 = require("../../middlewares/parseJson");
const router = express_1.default.Router();
// create a new customer with card
// router.post(
//   "/save-card",
//   auth(),
//   validateRequest(TStripeSaveWithCustomerInfoPayloadSchema),
//   StripeController.saveCardWithCustomerInfo
// );
// Authorize the customer with the amount and send payment request
// router.post(
//   "/authorize-payment",
//   validateRequest(AuthorizedPaymentPayloadSchema),
//   StripeController.authorizedPaymentWithSaveCard
// );
// Capture the payment request and deduct the amount
// router.post(
//   "/capture-payment",
//   validateRequest(capturedPaymentPayloadSchema),
//   StripeController.capturePaymentRequest
// );
// Save new card to existing customer
// router.post(
//   "/save-new-card",
//   validateRequest(saveNewCardWithExistingCustomerPayloadSchema),
//   StripeController.saveNewCardWithExistingCustomer
// );
// Get all save cards for customer
router.get("/get-cards/:customerId", stripe_controller_1.StripeController.getCustomerSavedCards);
// Delete card from customer
router.delete("/delete-card/:paymentMethodId", stripe_controller_1.StripeController.deleteCardFromCustomer);
// Refund payment to customer
// router.post(
//   "/refund-payment",
//   validateRequest(refundPaymentPayloadSchema),
//   StripeController.refundPaymentToCustomer
// );
router.post("/create-payment-intent", multer_1.multerUpload.array("clientRequirement"), parseJson_1.parseBodyData, stripe_controller_1.StripeController.createPaymentIntent);
router.patch("/deliver-project/:id", stripe_controller_1.StripeController.deliverProject);
exports.StripeRoutes = router;
