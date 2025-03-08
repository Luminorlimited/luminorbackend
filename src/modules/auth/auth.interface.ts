import mongoose, { Model } from "mongoose";
import { ENUM_USER_ROLE } from "../../enums/user";

export type IUser = {
  password: string;
  email: string;

  name: {
    firstName: string;
    lastName: string;
  };

  role: ENUM_USER_ROLE;
  googleId?: string;
  facebookId?: string;
  otp?: string;
  otpExpiry?: Date;
  identifier?: string;
  stripe?: {
    customerId: string;
    onboardingUrl: string;
    isOnboardingSucess: boolean;
  };
  client?: mongoose.Schema.Types.ObjectId;
  profileUrl?: string;
  isDeleted?: boolean;
  isActivated:boolean;
  isFirstLogin?:boolean
 
};

export type IUserExistReturn = {
  _id: mongoose.Types.ObjectId;
  email: string;

  password: string;
  role: ENUM_USER_ROLE;
  name: {
    firstName: string;
    lastName: string;
  };
};

export type ILoginUser = {
  email: string;
  password: string;
};
export type ILoginUserResponse = {
  refreshToken?: string;
  accessToken: string;
  user: IUser;
};
export type IRefreshTokenResponse = {
  accessToken: string;
};

export type UserModel = {
  isUserExist(
    email: string
  ): Promise<
    Pick<IUserExistReturn, "email" | "password" | "_id" | "role" | "name">
  >;
  isPasswordMatched(
    givenPassword: string,
    savedPassword: string
  ): Promise<boolean>;
} & Model<IUser>;
