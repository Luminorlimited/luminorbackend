import express from "express";

import auth from "../../middlewares/auth";
import { ZoomController } from "./zoom.controller";

const router = express.Router();

// create a new customer with card
router.post(
  "/create-zoom-link",

  ZoomController.createZoomLInk

);

// Authorize the customer with the amount and send payment request

export const zoomRoutes = router;
