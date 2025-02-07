import { PAYMENTSTATUS } from "./transaction.interface";
import { Transaction } from "./transaction.model";

const getAllTransactions = async () => {
  const result = await Transaction.find().populate("orderId");
  
  return result;
};
const lastTransaction = async () => {
  const result = await Transaction.findOne()
    .populate("orderId")
    .sort({ createdAt: -1 }) 
    .lean(); 

  return result;
};
const totalRevenue = async () => {
  const result = await Transaction.aggregate([
    {
      $match: { paymentStatus: PAYMENTSTATUS.COMPLETED }, 
    },
    {
      $group: {
        _id: null, 
        totalRevenue: { $sum: "$amount" }, 
      },
    },
  ]);

  return result.length > 0 ? result[0].totalRevenue : 0;
};
const totlaRefunded = async () => {
  const result = await Transaction.aggregate([
    {
      $match: { paymentStatus: PAYMENTSTATUS.REFUNDED }, // Only refunded transactions
    },
    {
      $group: {
        _id: null, 
        totalRefunded: { $sum: "$amount" }, 
      },
    },
  ]);

 const totalRevenue= result.length > 0 ? result[0].totalRefunded : 0;

 return {totalRevenue}
};


export const TransactionService = {
    getAllTransactions,
    lastTransaction,
    totalRevenue,
    totlaRefunded,
    
};
