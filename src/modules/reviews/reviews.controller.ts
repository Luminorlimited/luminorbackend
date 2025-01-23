import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";

import { ReviewsService } from "./reviews.service";
import ApiError from "../../errors/handleApiError";
import { Client } from "../client/client.model";

const postReviews = catchAsync(async (req: Request, res: Response) => {
    const review=req.body
    const professionalId=req.params.id
    const user = req.user as any;

     const client=await Client.findOne({client:user.id})
     if(!client){
      throw new ApiError(StatusCodes.UNAUTHORIZED,"client not found")
     }
    review.clientId = client._id; 
   
   console.log(review,"check review")
   const result=await ReviewsService.postReviews(professionalId,review)
  
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
  
      message: "your review post successfully",
     
      data: result,
    });
  });

  export const ReviewController={
    postReviews
  }