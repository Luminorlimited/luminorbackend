import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthService } from "./auth.service";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/handleApiError";
import { uploadFileToSpace } from "../../utilitis/uploadTos3";
import { json } from "body-parser";

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
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});
const getProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const result = await AuthService.getProfile(user.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User profile get successfully",
    data: result,
  });
});
const getSingleUserById = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.getSingleUserById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "single user  get successfully",
    data: result,
  });
});
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
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
const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;

  // let profileUrl;
  // if (req.file) {
  //   profileUrl = await uploadFileToSpace(req.file, "profileImage");
  // }
  // const data = { ...req.body, profileUrl };
  const result = await AuthService.updateAdmin(user.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "admin update his profile successfully",
    data: result,
  });
});
const updateAdminProfilePic = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as any;

    if (!req.file) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "file not found ");
    }
    const profileImage = await uploadFileToSpace(req.file, "profileImage");
    const result = await AuthService.updateAdminProfilePic(
      user.id,
      profileImage
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "admin update his profile successfully",
      data: result,
    });
  }
);
const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const { status } = req.body;

  const result = await AuthService.updateUserStatus(id, JSON.parse(status));
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `user  status update  successfully `,
    data: result,
  });
});
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;

  const result = await AuthService.forgotPassword(user?.id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: ` otp has been send to your gmail account.please verify it`,
    data: result,
  });
});
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;

  const result = await AuthService.resetPassword(user?.id as string, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: ` reset password successfully`,
    data: result,
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
  updateAdmin,
  updateAdminProfilePic,
  updateUserStatus,
  forgotPassword,
  resetPassword,
};
