import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";

import { Request, Response } from "express";
import ApiError from "../../errors/handleApiError";
import { OrderService } from "./order.service";
import { IOrder } from "./order.interface";

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const order = req.body;

  const result = await OrderService.createOrder(order);

  sendResponse<IOrder>(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "order   successfully",
    data: result,
  });
});
const getOrderByProfessional = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.params.id;

    const messages = await OrderService.getOrderByProfessional(user);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,

      message: "order get by professional   successfull",
      data: messages,
    });
  }
);
const getSpecificOrderBYClientAndProfessional = catchAsync(
  async (req: Request, res: Response) => {
    const professional = req.query.professional as string | undefined;
    const client = req.query.client as string | undefined;

    if (!professional || !client) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Both professional and client must be provided and must be strings"
      );
    }

    const list = await OrderService.getSpecificOrderBYClientAndProfessional(
      client,
      professional
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Specific client and professional order retrieved successfully",
      data: list,
    });
  }
);

const getOrderById = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "header not found");
  }

  // console.log(req.user)

  const list = await OrderService.getOrderById(req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "single order get successfull",
    data: list,
  });
});
export const OrderController = {
  createOrder,
  getOrderByProfessional,
  getSpecificOrderBYClientAndProfessional,
  getOrderById,
};
