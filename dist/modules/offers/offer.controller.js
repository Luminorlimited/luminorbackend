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
exports.OfferController = void 0;
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const offer_service_1 = require("./offer.service");
const calculateTotalPrice_1 = require("../../utilitis/calculateTotalPrice");
const generateOfferPdf_1 = require("../../utilitis/generateOfferPdf");
const createOffer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    data.totalPrice = (0, calculateTotalPrice_1.calculateTotalPrice)(data);
    const offerPDFPath = yield (0, generateOfferPdf_1.generateOfferPDF)(data);
    // console.log(offerPDFPath, "check offerpdf path");
    data.orderAgreementPDF = offerPDFPath;
    const result = yield offer_service_1.OfferService.createOffer(data);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `Offer created successfully`,
        data: result,
    });
}));
const getOffersByProfessional = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const result = yield offer_service_1.OfferService.getOffersByProfessional(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `Retire Professional Offers get successfully`,
        data: result,
    });
}));
const getSingleOffer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    // console.log(id, "check params");
    const result = yield offer_service_1.OfferService.getSingleOffer(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `single offer get successfully`,
        data: result,
    });
}));
const deleteSingleOffer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    // console.log(id, "check params");
    const result = yield offer_service_1.OfferService.deleteSingleOffer(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `delete  offer  successfully`,
        data: result,
    });
}));
const getAllOffers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    // console.log(id, "check params");
    const result = yield offer_service_1.OfferService.getAllOffers();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `all   offer  get  successfully`,
        data: result,
    });
}));
exports.OfferController = {
    createOffer,
    getOffersByProfessional,
    getSingleOffer,
    deleteSingleOffer,
    getAllOffers
};
