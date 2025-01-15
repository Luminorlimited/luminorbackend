import express from "express";

import { OrderController } from "./order.controller";

const router = express.Router();

export const OrderRoute = router;
router.post(
  "/",

  OrderController.createOrder
);
router.get(
  "/professional",

  OrderController.getSpecificOrderBYClientAndProfessional
);
router.get(
  "/:id",

  OrderController.getOrderById
);

router.get("/professional/:id", OrderController.getOrderByProfessional);
