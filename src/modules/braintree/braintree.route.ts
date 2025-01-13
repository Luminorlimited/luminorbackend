import express from "express";
import { BrainTreeController } from "./braintree.controller";

const router = express.Router();

export const BrainTreeRoute = router;

router.get("/generate-token", BrainTreeController.generateClientToken);
router.post("/pay", BrainTreeController.processPayment);
