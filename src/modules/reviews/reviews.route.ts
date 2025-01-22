import express from "express";
import { ReviewController } from "./reviews.controller";

const router = express.Router();

export const ReviewRoute = router;
router.post(
  "/",
  ReviewController.postReviews

  
);

