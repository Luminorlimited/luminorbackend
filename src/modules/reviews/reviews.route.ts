import express from "express";
import { ReviewController } from "./reviews.controller";
import auth from "../../middlewares/auth";
import { ENUM_USER_ROLE } from "../../enums/user";

const router = express.Router();

export const ReviewRoute = router;
router.patch("/:id", auth(ENUM_USER_ROLE.CLIENT), ReviewController.postReviews);
router.get("/get-professional-review",auth(),ReviewController.getReviews)