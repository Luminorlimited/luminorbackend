"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const transaction_interface_1 = require("./transaction.interface");
const transaction_model_1 = require("./transaction.model");
const getAllTransactions = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield transaction_model_1.Transaction.find().populate("orderId");
    return result;
});
const lastTransaction = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield transaction_model_1.Transaction.findOne()
        .populate("orderId")
        .sort({ createdAt: -1 })
        .lean();
    return result;
});
const totalRevenue = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield transaction_model_1.Transaction.aggregate([
        {
            $match: { paymentStatus: transaction_interface_1.PAYMENTSTATUS.COMPLETED },
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$amount" },
            },
        },
    ]);
    return result.length > 0 ? result[0].totalRevenue : 0;
});
const totlaRefunded = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield transaction_model_1.Transaction.aggregate([
        {
            $match: { paymentStatus: transaction_interface_1.PAYMENTSTATUS.REFUNDED }, // Only refunded transactions
        },
        {
            $group: {
                _id: null,
                totalRefunded: { $sum: "$amount" },
            },
        },
    ]);
    const totalRevenue = result.length > 0 ? result[0].totalRefunded : 0;
    return { totalRevenue };
});
const getTransactionCalculation = () => __awaiter(void 0, void 0, void 0, function* () {
    const currentYear = new Date().getFullYear();
    const monthlyIncome = yield transaction_model_1.Transaction.aggregate([
        {
            $match: {
                paymentStatus: "delivered",
                createdAt: {
                    $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                    $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
                },
            },
        },
        {
            $group: {
                _id: { $month: "$createdAt" },
                totalIncome: { $sum: "$amount" },
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]);
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const formattedIncome = monthNames.map((month, index) => {
        const data = monthlyIncome.find((item) => item._id === index + 1);
        return {
            month,
            totalIncome: data ? data.totalIncome : 0,
        };
    });
    console.log("Monthly Income:", formattedIncome);
    return { yearlyIncome: formattedIncome };
});
exports.TransactionService = {
    getAllTransactions,
    lastTransaction,
    totalRevenue,
    totlaRefunded,
    getTransactionCalculation
};
