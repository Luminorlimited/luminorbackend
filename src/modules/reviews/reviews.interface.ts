import mongoose from "mongoose";
enum Rating {
    ONE = 1,
    TWO = 2,
    THREE = 3,
    FOUR = 4,
    FIVE = 5,
  }

export type IReview = {
    clientId: mongoose.Types.ObjectId;
    retireProfessionalId:mongoose.Types.ObjectId
  
    rating: Rating; 
    feedback: string; 
  
  };
  