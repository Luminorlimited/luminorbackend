import express from "express";
import { ReviewController } from "./reviews.controller";
import auth from "../../middlewares/auth";
import { ENUM_USER_ROLE } from "../../enums/user";


const router = express.Router();

export const ReviewRoute = router;
router.patch("/clientReview/:id", auth(ENUM_USER_ROLE.CLIENT), ReviewController.postReviewsByClient);
router.patch("/professionalReview/:id", auth(ENUM_USER_ROLE.RETIREPROFESSIONAL), ReviewController.postReviewsByRetireProfessional);

router.get("/get-professional-review",auth(),ReviewController.getReviews);
