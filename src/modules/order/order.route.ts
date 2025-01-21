import express from "express";

import { OrderController } from "./order.controller";
import auth from "../../middlewares/auth";
import { ENUM_USER_ROLE } from "../../enums/user";

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
router.get("/professional-order",  auth(ENUM_USER_ROLE.RETIREPROFESSIONAL), OrderController.getOrderByProfessional);
router.get("/client-order",  auth(ENUM_USER_ROLE.CLIENT), OrderController.getOrderByProfessional);
router.get(
  "/:id",

  OrderController.getOrderById
);


