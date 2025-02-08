"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRoute = void 0;
const express_1 = __importDefault(require("express"));
const order_controller_1 = require("./order.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../enums/user");
const router = express_1.default.Router();
exports.OrderRoute = router;
router.post("/", order_controller_1.OrderController.createOrder);
router.get("/professional", order_controller_1.OrderController.getSpecificOrderBYClientAndProfessional);
router.get("/professional-order", (0, auth_1.default)(user_1.ENUM_USER_ROLE.RETIREPROFESSIONAL), order_controller_1.OrderController.getOrderByProfessional);
router.get("/client-order", (0, auth_1.default)(user_1.ENUM_USER_ROLE.CLIENT), order_controller_1.OrderController.getOrderByProfessional);
router.get("/get-all-orders", order_controller_1.OrderController.getAllOrders);
router.get("/:id", order_controller_1.OrderController.getOrderById);
