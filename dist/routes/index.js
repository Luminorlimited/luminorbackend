"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = __importDefault(require("express"));
const client_route_1 = require("../modules/client/client.route");
const auth_route_1 = require("../modules/auth/auth.route");
const offer_route_1 = require("../modules/offers/offer.route");
const professional_route_1 = require("../modules/professional/professional.route");
const reviews_route_1 = require("../modules/reviews/reviews.route");
const messages_route_1 = require("../modules/messages/messages.route");
const notification_route_1 = require("../modules/notification/notification.route");
const stripe_route_1 = require("../modules/stipe/stripe.route");
const paypal_route_1 = require("../modules/paypal/paypal.route");
const zoom_route_1 = require("../modules/zoom/zoom.route");
const braintree_route_1 = require("../modules/braintree/braintree.route");
const order_route_1 = require("../modules/order/order.route");
const transaction_route_1 = require("../modules/transaction/transaction.route");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: "/client",
        route: client_route_1.ClientRoute,
    },
    {
        path: "/retireProfessional",
        route: professional_route_1.RetireProfessionalRoute,
    },
    {
        path: "/auth",
        route: auth_route_1.AuthRoute,
    },
    {
        path: "/offer",
        route: offer_route_1.OfferRoute,
    },
    {
        path: "/review",
        route: reviews_route_1.ReviewRoute,
    },
    {
        path: "/messages",
        route: messages_route_1.MessageRoutes,
    },
    {
        path: "/notification",
        route: notification_route_1.NotificationRoutes,
    },
    {
        path: "/stripe",
        route: stripe_route_1.StripeRoutes,
    },
    {
        path: "/paypal",
        route: paypal_route_1.paypalRoute,
    },
    { path: "/zoom", route: zoom_route_1.zoomRoutes },
    {
        path: "/braintree",
        route: braintree_route_1.BrainTreeRoute,
    },
    {
        path: "/order",
        route: order_route_1.OrderRoute,
    },
    {
        path: "/transaction",
        route: transaction_route_1.TransactionRoute
    }
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.routes = router;
