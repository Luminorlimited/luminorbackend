import express from "express";

import { StripeController } from "./stripe.controller";

import { multerUpload } from "../../middlewares/multer";
import { parseBodyData } from "../../middlewares/parseJson";
import auth from "../../middlewares/auth";

const router = express.Router();

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
router.get("/get-cards/:customerId", StripeController.getCustomerSavedCards);

// Delete card from customer
router.delete(
  "/delete-card/:paymentMethodId",
  StripeController.deleteCardFromCustomer
);

// Refund payment to customer
// router.post(
//   "/refund-payment",
//   validateRequest(refundPaymentPayloadSchema),
//   StripeController.refundPaymentToCustomer
// );

router.post(
  "/create-payment-intent",
  multerUpload.array("clientRequirement"),
  parseBodyData,
  StripeController.createPaymentIntent
);
router.patch("/deliver-project/:id", StripeController.deliverProject);
router.patch("/update-url",auth(),StripeController.generateAccountLink)

export const StripeRoutes = router;
