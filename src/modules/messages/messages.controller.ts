import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { IMessage } from "./messages.interface";
import { MessageService } from "./messages.service";
import { Request, Response } from "express";
import ApiError from "../../errors/handleApiError";

const createMessage = catchAsync(async (req: Request, res: Response) => {
  const createMessage = req.body;

  const result = await MessageService.createMessage(createMessage);

  sendResponse<IMessage>(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "Message create   successfully",
    data: result,
  });
});
const getMessages = catchAsync(async (req: Request, res: Response) => {
  const { user1, user2 } = req.query;

  const messages = await MessageService.getMessages(
    user1 as string,
    user2 as string
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "Message get   successfully",
    data: messages,
  });
});
const getConversationLists = catchAsync(async (req: Request, res: Response) => {
  if (!req.user ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "header not found");
  }


  const list = await MessageService.getConversationLists((req.user as any).email as string);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "convirsation list  get   successfully",
    data: list,
  });
});
const uploadMessagefile = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;

  //  console.log(req.file,"check req.file")

  if (!file) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "choose a file");
  }
  const fileUrl = await MessageService.uploadMessagefile(file);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "file upload    successfully",
    data: fileUrl,
  });
});
export const MessageController = {
  createMessage,
  getMessages,
  getConversationLists,
  uploadMessagefile,
};
