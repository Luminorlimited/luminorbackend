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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const handleApiError_1 = __importDefault(require("../../errors/handleApiError"));
const auth_model_1 = require("../auth/auth.model");
const order_model_1 = require("./order.model");
const createOrder = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_model_1.Order.create(payload);
    return result;
});
const getOrderByProfessional = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield order_model_1.Order.find({ orderReciver: email })
            .populate("project")
            .populate("transaction");
        return result;
    }
    catch (error) {
        console.error("Error fetching orders by professional:", error);
        throw error;
    }
});
const getOrderByClient = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_model_1.Order.find({ orderFrom: email })
        .populate("project")
        .populate("transaction");
    return result;
});
const getSpecificOrderBYClientAndProfessional = (clientId, professionalId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_model_1.Order.find({
        orderReciver: professionalId,
        orderFrom: clientId,
    })
        .populate("project")
        .populate("transaction");
    return result;
});
const getOrderById = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_model_1.Order.findById(orderId)
        .populate("project")
        .populate("transaction");
    const [client, retireProfessional] = yield Promise.all([
        auth_model_1.User.find({ email: result === null || result === void 0 ? void 0 : result.orderReciver }).select("name.firstName name.lastName"),
        auth_model_1.User.find({ email: result === null || result === void 0 ? void 0 : result.orderFrom }).select("name.firstName name.lastName"),
    ]);
    return { result, client, retireProfessional };
});
const getAllOrders = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_model_1.Order.find()
        .populate("project")
        .populate("transaction")
        .populate("orderFrom")
        .populate("orderReciver");
    return { result };
});
const getOrderCalculation = (adminId, timeframe) => __awaiter(void 0, void 0, void 0, function* () {
    if (!adminId) {
        throw new handleApiError_1.default(404, "Owner ID is required.");
    }
    let startDate = new Date();
    let endDate = new Date();
    switch (timeframe) {
        case "weekly":
            // Set the start to last Monday
            startDate.setDate(startDate.getDate() - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1));
            startDate.setHours(0, 0, 0, 0);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
        case "monthly":
            startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        case "yearly":
            startDate = new Date(startDate.getFullYear(), 0, 1);
            endDate = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        default:
            throw new handleApiError_1.default(404, "Invalid timeframe. Use weekly, monthly, or yearly.");
    }
    // Fetch aggregated orders from MongoDB
    const orderData = yield order_model_1.Order.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            },
        },
        {
            $group: {
                _id: {
                    $switch: {
                        branches: [
                            { case: { $eq: [timeframe, "weekly"] }, then: { $dayOfWeek: "$createdAt" } }, // Group by weekday
                            { case: { $eq: [timeframe, "monthly"] }, then: { $dayOfMonth: "$createdAt" } }, // Group by date
                            { case: { $eq: [timeframe, "yearly"] }, then: { $month: "$createdAt" } }, // Group by month
                        ],
                        default: null,
                    },
                },
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: { $toDouble: "$totalPrice" } },
            },
        },
        {
            $sort: { _id: 1 }, // Sort timeline in ascending order
        },
    ]);
    // Format timeline data
    const timeline = {};
    orderData.forEach(({ _id, totalOrders }) => {
        if (timeframe === "weekly") {
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            timeline[days[_id - 1]] = totalOrders;
        }
        else if (timeframe === "monthly") {
            timeline[`Day ${_id}`] = totalOrders;
        }
        else if (timeframe === "yearly") {
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            timeline[months[_id - 1]] = totalOrders;
        }
    });
    // Calculate totals
    const totalOrders = orderData.reduce((sum, data) => sum + data.totalOrders, 0);
    const totalRevenue = orderData.reduce((sum, data) => sum + data.totalRevenue, 0);
    return {
        timeframe,
        totalOrders,
        totalRevenue,
        timeline,
    };
});
exports.OrderService = {
    createOrder,
    getOrderByProfessional,
    getSpecificOrderBYClientAndProfessional,
    getOrderById,
    getOrderByClient,
    getAllOrders,
    getOrderCalculation,
};
