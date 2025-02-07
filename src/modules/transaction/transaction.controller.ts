import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";

import { Request, Response } from "express";
import ApiError from "../../errors/handleApiError";
import { TransactionService } from "./transaction.service";

const getAllTransactions = catchAsync(async (req: Request, res: Response) => {


  const result = await TransactionService.getAllTransactions() 

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "All Transaction get   successfully",
    data: result,
  });
});
const lastTransaction = catchAsync(async (req: Request, res: Response) => {

  const result = await TransactionService.lastTransaction() 

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "Last Transaction get   successfully",
    data: result,
  });
});
const totalRevenue = catchAsync(async (req: Request, res: Response) => {

  const result = await TransactionService.totalRevenue() 

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "total Revenue get    successfully",
    data: result,
  });
});
const totlaRefunded = catchAsync(async (req: Request, res: Response) => {

  const result = await TransactionService.totlaRefunded() 

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "total refunded get    successfully",
    data: result,
  });
});
export const TransactionController = {
    getAllTransactions,
    lastTransaction,
    totalRevenue,
    totlaRefunded

};
