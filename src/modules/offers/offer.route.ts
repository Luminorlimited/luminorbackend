import express from "express";
import { OfferController } from "./offer.controller";

const router = express.Router();

export const OfferRoute = router;
router.post("/", OfferController.createOffer);
router.get("/professional/:id", OfferController.getOffersByProfessional);

router.get("/:id", OfferController.getSingleOffer);
router.delete("/delete/:id", OfferController.deleteSingleOffer);
