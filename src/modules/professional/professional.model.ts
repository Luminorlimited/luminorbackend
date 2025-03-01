import mongoose from "mongoose";
import { IProfessional } from "./professional.interface";

import { ENUM_SERVICE_PREFERENCE, INDUSTRIES } from "../../enums/service";

// Define the main Professional schema
const RetireProfessionalSchema = new mongoose.Schema<IProfessional>(
  {
    retireProfessional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Refers to the User model (this can be customized)
      required: true,
    },
    // Retired Professional account fields
    dateOfBirth: { type: Date, required: true },
   
    phoneNumber: { type: String, required: true },

    linkedinProfile: { type: String },
    previousPositions: { type: [String], required: true },

    references: [
      {
        emailOrPhone: { type: String, required: true },
        name: { type: String, required: true },
      },
    ],
    educationalBackground: { type: String, required: true },
    relevantQualification: {
      type: String,
      required: true,
    },
    technicalSkill: { type: [String], required: true },
    cvOrCoverLetter: { type: String, default: null },
    // Retired professional profile (optional)
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    profileUrl: { type: String, default: null },
    bio: { type: String, default: null },
    description: { type: String, default: null },
    expertise: { type: String, default: null },
    industry: { type: String, defaul: null },
    duration: { type: Number, default: null },
    availability: [
      {
        day: {
          type: String,
          enum: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          required: true
        },
        slots: {
          type: [String],
          enum: ["Morning", "Afternoon", "Evening"],
          required: true
        }
      }
    ],
    


    preferedProjects: { type: String, default: null },
    hourlyRate: { type: String, default: null },
    workSample: { type: String, default: null },

    averageRating: { type: Number, default: 0 },
    reviewCount: {
      type: Number,
      default: 0,
    },
    coverUrl: {
      type: String,
      default: null,
    },
  },

  { timestamps: true, versionKey: false }
);
RetireProfessionalSchema.index({ location: "2dsphere" });
export const RetireProfessional = mongoose.model(
  "RetireProfessional",
  RetireProfessionalSchema
);
