import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { BraintreeService } from "./braintree.service";

const generateClientToken = catchAsync(async (req: Request, res: Response) => {
  const result = await BraintreeService.generateClientToken();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "client token generate successfully",

    data: result,
  });
});
const processPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await BraintreeService.processPayment(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "payment successfull",

    data: result,
  });
});
export const BrainTreeController = {
  generateClientToken,
  processPayment,
};
