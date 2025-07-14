import express from "express";

import { StripeController } from "./stripe.controller";

import { multerUpload } from "../../middlewares/multer";
import { parseBodyData } from "../../middlewares/parseJson";
import auth from "../../middlewares/auth";
import { OrderController } from "../order/order.controller";
import { ENUM_USER_ROLE } from "../../enums/user";

const router = express.Router();

router.get("/stripe-card-lists", auth(), StripeController.getStripeCardLists);
router.get("/get-cards/:customerId", StripeController.getCustomerSavedCards);
router.post("/create-card", auth(), StripeController.createStripeCard);
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
router.patch(
  "/deliver-project/:id",
  auth(ENUM_USER_ROLE.CLIENT),
  StripeController.acceptProject
);
router.post(
  "/generate-onboarding-url",
  auth(),
  StripeController.generateAccountLink
);
router.get(
  "/delivery-request/:id",
  auth(ENUM_USER_ROLE.RETIREPROFESSIONAL),
  StripeController.deliverRequest
);
router.post("/refund-payment/:id",auth(ENUM_USER_ROLE.CLIENT), StripeController.refundPaymentToCustomer);
router.patch(
  "/revision-request/:id",
  auth(ENUM_USER_ROLE.CLIENT),
  StripeController.revesion
);

export const StripeRoutes = router;
