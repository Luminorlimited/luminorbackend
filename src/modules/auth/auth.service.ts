import { Secret } from "jsonwebtoken";
import config from "../../config";
import ApiError from "../../errors/handleApiError";
import { ILoginUser } from "./auth.interface";
import { User } from "./auth.model";
import { StatusCodes } from "http-status-codes";
import Stripe from "stripe";
import emailSender from "../../utilitis/emailSender";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import { activeEnumValue, ENUM_USER_ROLE, IS_ACTIVATE } from "../../enums/user";
import { RetireProfessional } from "../professional/professional.model";
import { Client } from "../client/client.model";
import bcrypt from "bcrypt";
import { IClient } from "../client/client.interface";
import { IProfessional } from "../professional/professional.interface";
const stripe = new Stripe(config.stripe.secretKey as string, {
  apiVersion: "2025-01-27.acacia",
});
const loginUser = async (payload: ILoginUser) => {
  const { email, password } = payload;
  const isUserExist = await User.isUserExist(email);
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User Doesn,t Exist");
  }
  if (
    isUserExist.password &&
    !(await User.isPasswordMatched(password, isUserExist.password))
  ) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Password is incorrect");
  }
  if (isUserExist.isActivated !== IS_ACTIVATE.ACTIVE) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "your account is not activate yet.please contect with support"
    );
  }

  const { _id: userId, email: userEmail, role } = isUserExist;
  
  const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  if (isUserExist.role === ENUM_USER_ROLE.ADMIN) {
    const accessToken = jwtHelpers.createToken(
      {
        id: isUserExist._id,
        email: isUserExist.email,
        role: isUserExist.role,
      },
      config.jwt.secret as Secret,
      config.jwt.expires_in as string
    );
    return { accessToken, isUserExist };
  }
  const html = `<!DOCTYPE html>
 <html lang="en">
 <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>OTP Verification</title>
 </head>
 <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0; line-height: 1.6;">
     <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
         <div style="background-color: #FF7600; background-image: linear-gradient(135deg, #FF7600, #45a049); padding: 30px 20px; text-align: center;">
             <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">OTP Verification</h1>
         </div>
         <div style="padding: 20px 12px; text-align: center;">
             <p style="font-size: 18px; color: #333333; margin-bottom: 10px;">Hello,</p>
             <p style="font-size: 18px; color: #333333; margin-bottom: 20px;">Your OTP for verifying your account is:</p>
             <p style="font-size: 36px; font-weight: bold; color: #FF7600; margin: 20px 0; padding: 10px 20px; background-color: #f0f8f0; border-radius: 8px; display: inline-block; letter-spacing: 5px;">${randomOtp}</p>
             <p style="font-size: 16px; color: #555555; margin-bottom: 20px; max-width: 400px; margin-left: auto; margin-right: auto;">Please enter this OTP to complete the verification process. This OTP is valid for 5 minutes.</p>
             <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                 <p style="font-size: 14px; color: #888888; margin-bottom: 4px;">Thank you for choosing our service!</p>
                 <p style="font-size: 14px; color: #888888; margin-bottom: 0;">If you didn't request this OTP, please ignore this email.</p>
             </div>
         </div>
         <div style="background-color: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #999999;">
             <p style="margin: 0;">© 2023 Your Company Name. All rights reserved.</p>
         </div>
     </div>
 </body>
 </html>`;
   emailSender("Luminor OTP", userEmail, html);
  const result = await User.updateOne(
    { _id: userId },
    {
      $set: {
        otp: randomOtp,
        otpExpiry: otpExpiry,
      },
    }
  );
  if (result.modifiedCount === 0) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update OTP"
    );
  }
  return randomOtp;
};
const enterOtp = async (payload: any) => {
  const userData = await User.findOne({
    otp: payload.otp,
    email: payload.email.toLowerCase(),
  });

  if (!userData) {
    throw new ApiError(404, "Your OTP is incorrect");
  }

  if (userData.otpExpiry && userData.otpExpiry < new Date()) {
    throw new ApiError(400, "Your OTP has expired");
  }

  let redirectTo = "/";
  if (userData.isFirstLogin) {
    redirectTo = `/user/editProfile/${userData.role}/${userData._id}`;

    await User.updateOne(
      { _id: userData.id },
      { $set: { isFirstLogin: false, otp: null, otpExpiry: null } }
    );
  } else {
    await User.updateOne(
      { _id: userData.id },
      { $set: { otp: null, otpExpiry: null } }
    );
  }

  // Generate JWT Token
  const accessToken = jwtHelpers.createToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );

  return {
    accessToken,
    redirectTo,
    user: {
      email: userData.email,
      role: userData.role,
      userId: userData._id,
      name: userData.name,
    },
  };
};

const getProfile = async (id: string) => {
  const user = await User.findById(id);
  if (user?.role === ENUM_USER_ROLE.ADMIN) {
    return user;
  }
  let result;
  if (user?.role === ENUM_USER_ROLE.RETIREPROFESSIONAL) {
    result = await RetireProfessional.findOne({
      retireProfessional: user.id,
    }).populate("retireProfessional");
  } else if (user?.role === ENUM_USER_ROLE.CLIENT) {
    result = await Client.findOne({ client: user.id }).populate("client");
  }
  return result || user;
};
const getSingleUserById = async (id: string) => {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User not found");
  }
  let result;
  if (user?.role === ENUM_USER_ROLE.RETIREPROFESSIONAL) {
    result = await RetireProfessional.findOne({
      retireProfessional: user._id,
    }).populate("retireProfessional");
  } else if (user?.role === ENUM_USER_ROLE.CLIENT) {
    result = await Client.findOne({ client: user._id }).populate("client");
  }
  return result;
};

const getAllUsers = async () => {
  const users = await User.find({ isDeleted: false }).sort({ createdAt: -1 });
  return users;
};
const getAllRetireProfiessional = async () => {
  const users = await RetireProfessional.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "retireProfessional",
        foreignField: "_id",
        as: "retireProfessional",
      },
    },
    { $unwind: "$retireProfessional" },
    { $match: { "retireProfessional.isDeleted": false } },
    { $sort: { "retireProfessional.createdAt": -1 } },
  ]);

  return users;
};
const getAllClients = async () => {
  const clients = await Client.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "client",
        foreignField: "_id",
        as: "client",
      },
    },
    { $unwind: "$client" },
    { $match: { "client.isDeleted": false } },
    { $sort: { "client.createdAt": -1 } },
  ]);

  return clients;
};
const createAdmin = async (payload: any) => {
  const existingAdmin = await User.findOne({ email: payload.email });
  if (existingAdmin) {
    return existingAdmin;
  }
  const admin = await User.create(payload);
  return admin;
};
const deleteUser = async (id: string) => {
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  if (!updatedUser) {
    throw new Error("User not found");
  }
  return updatedUser;
};
const updateCoverPhoto = async (id: string, coverUrl: string) => {
  let updatedUser = await Client.findOneAndUpdate(
    { client: id },
    { $set: { coverUrl } },
    { new: true }
  );
  if (!updatedUser) {
    updatedUser = await RetireProfessional.findOneAndUpdate(
      { retireProfessional: id },
      { $set: { coverUrl } },
      { new: true }
    );
  }
  return updatedUser;
};
const updateAdmin = async (id: string, payload: any) => {
  try {
    const result = await User.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    );
    return result;
  } catch (error) {
    console.error("Error updating admin:", error);
    throw error;
  }
};
const updateAdminProfilePic = async (id: string, profileImage: string) => {
  try {
    const result = await User.findByIdAndUpdate(
      id,
      { $set: { profileUrl: profileImage } },
      { new: true, runValidators: true }
    );

    if (!result) {
      throw new Error("User not found");
    }

    return result;
  } catch (error) {
    console.error("Error updating admin profile picture:", error);
    throw error;
  }
};

const forgotPassword = async (userId: string) => {
  const userData = await User.findById(userId);

  if (!userData?.isActivated) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Your account is not yet activate.please contact admin"
    );
  }

  const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #5633d1;  padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">OTP Verification</h1>
          </div>
          <div style="padding: 20px 12px; text-align: center;">
              <p style="font-size: 18px; color: #333333; margin-bottom: 10px;">Hello,</p>
              <p style="font-size: 18px; color: #333333; margin-bottom: 20px;">Your OTP for verifying your account is:</p>
              <p style="font-size: 36px; font-weight: bold; color: #FF7600; margin: 20px 0; padding: 10px 20px; background-color: #f0f8f0; border-radius: 8px; display: inline-block; letter-spacing: 5px;">${randomOtp}</p>
              <p style="font-size: 16px; color: #555555; margin-bottom: 20px; max-width: 400px; margin-left: auto; margin-right: auto;">Please enter this OTP to complete the verification process. This OTP is valid for 5 minutes.</p>
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <p style="font-size: 14px; color: #888888; margin-bottom: 4px;">Thank you for choosing our service!</p>
                  <p style="font-size: 14px; color: #888888; margin-bottom: 0;">If you didn't request this OTP, please ignore this email.</p>
              </div>
          </div>
          <div style="background-color: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #999999;">
              <p style="margin: 0;">© 2023 Your Company Name. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>`;

  // Send the OTP email
  await emailSender("Luminor OTP", userData.email, html);
  const result = await User.updateOne(
    { _id: userId },
    {
      $set: {
        otp: randomOtp,
        otpExpiry: otpExpiry,
      },
    }
  );
  if (result.modifiedCount === 0) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update OTP"
    );
  }
  return randomOtp;
};
const updateUserStatus = async (id: string, status: string) => {
  const result = await User.findOne({ _id: id });
  let updatedUser;

  if (!activeEnumValue.includes(status as string)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid status provided.");
  }

  if (!result?.email) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Email not found");
  }

  const userName = result.name?.firstName || "User";
  let subject = "Account Update";
  let html = `
    <p>Hi ${userName},</p>
    <p>Your account status has been updated. Please contact support for more information.</p>
  `;

  if (status === IS_ACTIVATE.ACTIVE) {
    let accountId = result.stripe?.customerId;

    let onboardingUrl = result.stripe?.onboardingUrl;
    let isOnboardingCompleted = result.stripe?.isOnboardingSucess;
    console.log(isOnboardingCompleted, "check is onbaording complete");
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: result.email,
      });
      accountId = account.id;
    }

    if (!isOnboardingCompleted) {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: "https://your-platform.com/reauth",
        return_url: "https://www.luminor-ltd.com",
        type: "account_onboarding",
      });
      onboardingUrl = accountLink.url;
    }

    updatedUser = await User.findOneAndUpdate(
      { _id: result._id },
      {
        $set: {
          "stripe.customerId": accountId,
          "stripe.onboardingUrl": onboardingUrl || "",
          "stripe.isOnboardingSucess": isOnboardingCompleted ?? false,
          isActivated: IS_ACTIVATE.ACTIVE,
        },
      },

      { new: true }
    );

    subject = "Luminor Account Activated";
    html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Account Activated</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #5633d1; padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Account Activated</h1>
        </div>
        <div style="padding: 20px 20px; text-align: left;">
            <p style="font-size: 18px; color: #333333;">Dear <b>${userName}</b>,</p>
            <p style="font-size: 16px; color: #333333;">You have successfully been onboarded to <strong>Luminor</strong>.</p>
            <p style="font-size: 16px; color: #333333;">Please also fill out the following form to onboard to your Stripe account for future payments:</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${onboardingUrl}" style="background-color: #5633d1; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Complete Stripe Onboarding</a>
            </div>

            <p style="font-size: 14px; color: #d9534f; text-align: center; margin-top: -10px;">
              Note: This Stripe onboarding link will expire within a few minutes.<br/>
    If the link is not working, please generate a new onboarding link by clicking the button below.
           </p>
            </p>

            <div style="text-align: center; margin: 20px 10px;">
                <a href=https://www.luminor-ltd.com/user/editProfile/retireProfessional/${id}" style="background-color: #6c757d; color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-size: 14px;">Generate New Onboarding Link</a>
            </div>

            <p style="font-size: 16px; color: #333333;">We look forward to having you on our platform.</p>

           
        </div>
        <div style="background-color: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #999999;">
            <p style="margin: 0;">© 2025 Luminor. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  } else if (status === IS_ACTIVATE.INACTIVE) {
    subject = "Luminor Application Declined";
    html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Application Declined</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #5633d1; padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Application Declined</h1>
        </div>
        <div style="padding: 20px 20px; text-align: left;">
            <p style="font-size: 18px; color: #333333;">Dear <b>${userName}</b>,</p>
            <p style="font-size: 16px; color: #333333;">Unfortunately, your application for <strong>Luminor</strong> has been declined.</p>
            <p style="font-size: 16px; color: #333333;">If you have any questions, please contact us at:</p>
            <p style="font-size: 16px; font-weight: bold; color: #5633d1;">luminorlimited@gmail.com</p>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
                <p style="font-size: 14px; color: #888888;">Thank you for considering Luminor.</p>
            </div>
        </div>
        <div style="background-color: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #999999;">
            <p style="margin: 0;">© 2025 Luminor. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    updatedUser = await User.findOneAndUpdate(
      { _id: result._id },
      { $set: { isActivated: IS_ACTIVATE.INACTIVE } },
      { new: true }
    );
  }

  // ✅ Send Email
  await emailSender(subject, result.email, html);

  return updatedUser;
};
const resetPassword = async (userId: string, payload: any) => {
  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    { $set: { password: hashedPassword } },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return { message: "Password reset successfully" };
};
const searchService = async (
  role: string,
  searchQuery: string
): Promise<IClient[] | IProfessional[]> => {
  let result: IClient[] | IProfessional[] = [];
  const normalizedQuery = (searchQuery ?? "").toString().trim();
  if (role === ENUM_USER_ROLE.CLIENT) {
    result = await RetireProfessional.find<IProfessional>({
      expertise: { $regex: normalizedQuery, $options: "i" },
    });
  } else if (role === ENUM_USER_ROLE.RETIREPROFESSIONAL) {
    result = await Client.find<IClient>({
      servicePreference: { $regex: normalizedQuery, $options: "i" },
    });
  }

  return result;
};

export const AuthService = {
  loginUser,
  enterOtp,
  getProfile,
  getSingleUserById,
  getAllUsers,
  getAllRetireProfiessional,
  getAllClients,
  createAdmin,
  deleteUser,
  updateCoverPhoto,
  updateAdmin,
  updateAdminProfilePic,
  updateUserStatus,
  forgotPassword,
  resetPassword,
  searchService,
};
