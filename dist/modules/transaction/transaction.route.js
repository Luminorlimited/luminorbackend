"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRoute = void 0;
const express_1 = __importDefault(require("express"));
const transaction_controller_1 = require("./transaction.controller");
const user_1 = require("../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
router.get("/get-all-trasaction", transaction_controller_1.TransactionController.getAllTransactions);
router.get("/last-transaction", transaction_controller_1.TransactionController.lastTransaction);
router.get("/total-revenue", transaction_controller_1.TransactionController.totalRevenue);
router.get("/total-refunded", transaction_controller_1.TransactionController.totlaRefunded);
router.get("/get-transaction-calculation", (0, auth_1.default)(user_1.ENUM_USER_ROLE.ADMIN), transaction_controller_1.TransactionController.getTransactionCalculation);
exports.TransactionRoute = router;
