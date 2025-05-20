import mongoose from "mongoose";


export type IReview = {
  rating: number;
  feedBack: string;
  user: mongoose.Schema.Types.ObjectId;
 
  createdAt: Date;
};

export type IClient = {
  client: mongoose.Schema.Types.ObjectId;
  name?: {
    firstName?: string;
    lastName?: string;
  };

  dateOfBirth: Date;

  phoneNumber: string;
  businessType: string;
  companyName?: string;

  jobTitle: string;
  linkedinProfile?: string;

  //client profile
  profileUrl?: string;
  coverUrl?:string
  problemAreas?: string;
  // location?: {
  //   type: string;
  //   coordinates: [number];
  // };
  description?: string;
  companyWebsite: string;
  servicePreference?: string;
  industry: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  projectDurationRange?: number;
  projectListing?: string;
  // projectUrl?: string;
  projectPreference?:string[]
  averageRating: number;
  reviewCount:number

};

