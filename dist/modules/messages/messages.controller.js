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
exports.MessageController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const messages_service_1 = require("./messages.service");
const handleApiError_1 = __importDefault(require("../../errors/handleApiError"));
const createMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const createMessage = req.body;
    const result = yield messages_service_1.MessageService.createMessage(createMessage);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Message create   successfully",
        data: result,
    });
}));
const getMessages = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user1, user2 } = req.query;
    const user = req.user;
    // console.log(user,"check user")
    const messages = yield messages_service_1.MessageService.getMessages(user1, user2, user.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Message get   successfully",
        data: messages,
    });
}));
const getSingleMessages = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: user2 } = req.params;
    const user1 = req.user;
    // console.log(user,"check user")
    const messages = yield messages_service_1.MessageService.getSingleMessages(user1.id, user2);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Message get   successfully",
        data: messages,
    });
}));
const getConversationLists = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "header not found");
    }
    const list = yield messages_service_1.MessageService.getConversationLists(req.user.email);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "convirsation list  get   successfully",
        data: list,
    });
}));
const uploadMessagefile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    //  console.log(req.file,"check req.file")
    if (!file) {
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "choose a file");
    }
    const fileUrl = yield messages_service_1.MessageService.uploadMessagefile(file);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "file upload    successfully",
        data: fileUrl,
    });
}));
exports.MessageController = {
    createMessage,
    getMessages,
    getConversationLists,
    uploadMessagefile,
    getSingleMessages
};
