"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zoomRoutes = void 0;
const express_1 = __importDefault(require("express"));
const zoom_controller_1 = require("./zoom.controller");
const router = express_1.default.Router();
// create a new customer with card
router.post("/create-zoom-link", zoom_controller_1.ZoomController.createZoomLInk);
// Authorize the customer with the amount and send payment request
exports.zoomRoutes = router;
