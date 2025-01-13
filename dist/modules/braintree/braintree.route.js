"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrainTreeRoute = void 0;
const express_1 = __importDefault(require("express"));
const braintree_controller_1 = require("./braintree.controller");
const router = express_1.default.Router();
exports.BrainTreeRoute = router;
router.get("/generate-token", braintree_controller_1.BrainTreeController.generateClientToken);
router.post("/pay", braintree_controller_1.BrainTreeController.processPayment);
