import express from "express";
import { ReviewController } from "./reviews.controller";
import auth from "../../middlewares/auth";


const router = express.Router();

export const ReviewRoute = router;
router.patch("/:id", auth(), ReviewController.postReviews);
router.get("/get-professional-review",auth(),ReviewController.getReviews);
