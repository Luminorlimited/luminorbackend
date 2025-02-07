import express from "express";
import { TransactionController } from "./transaction.controller";




const router = express.Router();
router.get(
  "/get-all-trasaction",

  TransactionController.getAllTransactions
);
router.get("/last-transaction",TransactionController.lastTransaction)
router.get("/total-revenue",TransactionController.totalRevenue)
router.get("/total-refunded",TransactionController.totlaRefunded)
export const TransactionRoute = router;



