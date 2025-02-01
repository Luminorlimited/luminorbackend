import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";

import { ReviewsService } from "./reviews.service";
import ApiError from "../../errors/handleApiError";
import { Client } from "../client/client.model";

const postReviews = catchAsync(async (req: Request, res: Response) => {
    const review=req.body
    const reviewerId=req.params.id
    const user = req.user as any;


   
   //console.log(review,"check review")
   const result=await ReviewsService.postReviews(user.id,reviewerId,review)
  
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
  
      message: "your review post successfully",
     
      data: result,
    });
  });

  const getReviews=catchAsync(async (req: Request, res: Response) => {
    const review=req.body
    const professionalId=req.params.id
    const user = req.user as any;


   
  
   const result=await ReviewsService.getReviews(user.id)
  
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
  
      message: "your review get successfully",
     
      data: result,
    });
  });

  export const ReviewController={
    postReviews,
    getReviews
  }