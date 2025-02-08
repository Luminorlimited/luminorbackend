import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthService } from "./auth.service";

import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/handleApiError";
import { uploadFileToSpace } from "../../utilitis/uploadTos3";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { ...loginData } = req.body;

  const result = await AuthService.loginUser(loginData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "send otp",
    data: result,
  });
});

const enterOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.enterOtp(req.body);
  AuthService;
  // res.cookie("token", result.accessToken, { httpOnly: true });
  // res.cookie("token", result.accessToken, {
  //   secure: config.env === "production",
  //   httpOnly: true,
  //   sameSite: "none",
  //   maxAge: 1000 * 60 * 60 * 24 * 365,
  // });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});
const getProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;

  // console.log(user,"check user")
  // res.cookie("token", result.accessToken, { httpOnly: true });
  const result = await AuthService.getProfile(user.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User profile get successfully",
    data: result,
  });
});

const getSingleUserById = catchAsync(async (req: Request, res: Response) => {
  // console.log(user,"check user")
  // res.cookie("token", result.accessToken, { httpOnly: true });
  const result = await AuthService.getSingleUserById(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "single user  get successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  // console.log(user,"check user")
  // res.cookie("token", result.accessToken, { httpOnly: true });
  const result = await AuthService.getAllUsers();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All  user  get successfully",
    data: result,
  });
});

const getAllRetireProfiessional = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AuthService.getAllRetireProfiessional();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "All  Retire Professional   get successfully",
      data: result,
    });
  }
);
const getAllClients = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.getAllClients();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All  Retire Clients   get successfully",
    data: result,
  });
});

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;

  const result = await AuthService.createAdmin(data);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "admin created successfully",
    data: result,
  });
});
const delteUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  console.log();
  const result = await AuthService.deleteUser(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "user deleted successfully",
    data: result,
  });
});

const updateCoverPhoto = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  console.log();

  const file = req.file;
  if (!req.file) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "file not found ");
  }

  const coverUrl = await uploadFileToSpace(req.file, "user-cover-photo");
  const result = await AuthService.updateCoverPhoto(
    user.id as string,
    coverUrl
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "user cover photo updated  successfully",
    data: result,
  });
});
const updateAdmin=catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  console.log();

 
  const result = await AuthService.updateAdmin(user.id,req.body );
 

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "admin update his profile successfully",
    data:result
  });
});
export const AuthController = {
  loginUser,
  enterOtp,
  getProfile,
  getSingleUserById,
  getAllUsers,
  getAllRetireProfiessional,
  getAllClients,
  createAdmin,
  delteUser,
  updateCoverPhoto,
  updateAdmin
};
