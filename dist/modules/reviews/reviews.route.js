"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRoute = void 0;
const express_1 = __importDefault(require("express"));
const reviews_controller_1 = require("./reviews.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../enums/user");
const router = express_1.default.Router();
exports.ReviewRoute = router;
router.patch("/clientReview/:id", (0, auth_1.default)(user_1.ENUM_USER_ROLE.CLIENT), reviews_controller_1.ReviewController.postReviewsByClient);
router.patch("/professionalReview/:id", (0, auth_1.default)(user_1.ENUM_USER_ROLE.RETIREPROFESSIONAL), reviews_controller_1.ReviewController.postReviewsByRetireProfessional);
router.get("/get-professional-review", (0, auth_1.default)(), reviews_controller_1.ReviewController.getReviews);
