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

const getTransactionCalculation = async () => {
  const currentYear = new Date().getFullYear();


  const monthlyIncome = await Transaction.aggregate([
    {
      $match: {
        paymentStatus: "delivered", 
        createdAt: {
          $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`), 
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" }, 
        totalIncome: { $sum: "$amount" }, 
      },
    },
    {
      $sort: { _id: 1 }, 
    },
  ]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];


  const formattedIncome = monthNames.map((month, index) => {
    const data = monthlyIncome.find((item) => item._id === index + 1);
    return {
      month,
      totalIncome: data ? data.totalIncome : 0,
    };
  });

  console.log("Monthly Income:", formattedIncome);

  return { yearlyIncome: formattedIncome };
};

export const TransactionService = {
    getAllTransactions,
    lastTransaction,
    totalRevenue,
    totlaRefunded,
    getTransactionCalculation
    
};
