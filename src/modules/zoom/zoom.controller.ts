import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { zoomService } from "./zoom.service";




const createZoomLInk = catchAsync(async (req: Request, res: Response) => {

   const result=await zoomService.createZoomMeeting()
  
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
  
      message: "your review post successfully",
     
      data: result,
    });
  });

  export const ZoomController={
    createZoomLInk
  }