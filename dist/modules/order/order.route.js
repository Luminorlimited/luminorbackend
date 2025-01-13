"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRoute = void 0;
const express_1 = __importDefault(require("express"));
const order_controller_1 = require("./order.controller");
const router = express_1.default.Router();
exports.OrderRoute = router;
router.post("/", order_controller_1.OrderController.createOrder);
router.get("/professional", order_controller_1.OrderController.getSpecificOrderBYClientAndProfessional);
router.get("/:id", order_controller_1.OrderController.getOrderById);
router.get("/professional/:id", order_controller_1.OrderController.getOrderByProfessional);
