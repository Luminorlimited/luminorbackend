import express from "express";
import { TransactionController } from "./transaction.controller";
import { ENUM_USER_ROLE } from "../../enums/user";
import auth from "../../middlewares/auth";




const router = express.Router();
router.get(
  "/get-all-trasaction",

  TransactionController.getAllTransactions
);
router.get("/last-transaction",TransactionController.lastTransaction)
router.get("/total-revenue",TransactionController.totalRevenue)
router.get("/total-refunded",TransactionController.totlaRefunded)
router.get(
  "/get-transaction-calculation",
  auth(ENUM_USER_ROLE.ADMIN),
  TransactionController.getTransactionCalculation
);
export const TransactionRoute = router;



