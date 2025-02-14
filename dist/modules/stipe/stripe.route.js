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
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
router.get("/stripe-card-lists", (0, auth_1.default)(), stripe_controller_1.StripeController.getStripeCardLists);
router.get("/get-cards/:customerId", stripe_controller_1.StripeController.getCustomerSavedCards);
router.post("/create-card", (0, auth_1.default)(), stripe_controller_1.StripeController.createStripeCard);
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
