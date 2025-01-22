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
exports.OrderController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const handleApiError_1 = __importDefault(require("../../errors/handleApiError"));
const order_service_1 = require("./order.service");
const createOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const order = req.body;
    const result = yield order_service_1.OrderService.createOrder(order);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "order   successfully",
        data: result,
    });
}));
const getOrderByProfessional = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    // console.log(user)
    if (!user) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "user not found");
    }
    const order = yield order_service_1.OrderService.getOrderByProfessional(user.email);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "order get by professional   successfull",
        data: order,
    });
}));
const getOrderByClient = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    // console.log(user)
    if (!user) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "user not found");
    }
    const order = yield order_service_1.OrderService.getOrderByClient(user.email);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "order get by client   successfull",
        data: order,
    });
}));
const getSpecificOrderBYClientAndProfessional = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const professional = req.query.professional;
    const client = req.query.client;
    if (!professional || !client) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Both professional and client must be provided and must be strings");
    }
    // console.log(client,professional)
    const list = yield order_service_1.OrderService.getSpecificOrderBYClientAndProfessional(client, professional);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Specific client and professional order retrieved successfully",
        data: list,
    });
}));
const getOrderById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log(req.user)
    const list = yield order_service_1.OrderService.getOrderById(req.params.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "single order get successfull",
        data: list,
    });
}));
exports.OrderController = {
    createOrder,
    getOrderByProfessional,
    getSpecificOrderBYClientAndProfessional,
    getOrderById,
    getOrderByClient
};
