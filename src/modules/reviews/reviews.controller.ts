import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";

import { ReviewsService } from "./reviews.service";
import ApiError from "../../errors/handleApiError";
import { Client } from "../client/client.model";

const postReviewsByClient = catchAsync(async (req: Request, res: Response) => {
    const review=req.body
    const receiverId=req.params.id
    const user = req.user as any;


   
   //console.log(review,"check review")
   console.log(user,"check user")
   const result=await ReviewsService.postReviewsByClient(user.id,receiverId,review)
  
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
  
      message: "your review post successfully",
     
      data: result,
    });
  });
  const postReviewsByRetireProfessional = catchAsync(async (req: Request, res: Response) => {
    const review=req.body
    const receiverId=req.params.id
    const user = req.user as any;

    console.log(user,"check user")


   
   //console.log(review,"check review")
   const result=await ReviewsService.postReviewsByRetireProfessional(user.id,receiverId,review)
  
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
    postReviewsByClient,
    postReviewsByRetireProfessional,
    getReviews
  }