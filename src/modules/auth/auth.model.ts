import mongoose, { model } from "mongoose";
import { IUser, IUserExistReturn, UserModel } from "./auth.interface";
import { ENUM_USER_ROLE } from "../../enums/user";
import config from "../../config";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema<IUser>({
  name: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
  },
  role: {
    type: String,
    required: true,
    enum: ENUM_USER_ROLE,
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true,select:false},
  googleId: { type: String, default: null },
  facebookId: { type: String, defaul: null },
  stripe:{
    customerId:{
      type:String,
      default:null
    },
    onboardingUrl:{
      type:String,
      default:null
    },
  isOnboardingSucess:{
    type:Boolean,
    default:false
  }
  },

  otp: { type: String },
  otpExpiry: { type: Date },
  identifier: { type: String },
});
userSchema.statics.isUserExist = async function (
  email: string
): Promise<IUserExistReturn | null> {
  return await User.findOne({ email }).select("+password");
};
userSchema.statics.isPasswordMatched = async function (
  givenPassword: string,
  savedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(givenPassword, savedPassword);
};
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_round)
  );
  next();
});

export const User = model<IUser, UserModel>("User", userSchema);
// userSchema.set("autoIndex", true);
