"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRoute = void 0;
const express_1 = __importDefault(require("express"));
const reviews_controller_1 = require("./reviews.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
exports.ReviewRoute = router;
router.patch("/:id", (0, auth_1.default)(), reviews_controller_1.ReviewController.postReviews);
router.get("/get-professional-review", (0, auth_1.default)(), reviews_controller_1.ReviewController.getReviews);
