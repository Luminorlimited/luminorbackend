import { NextFunction, Request, Response } from "express";
import ApiError from "../errors/handleApiError";
import { StatusCodes } from "http-status-codes";
import { jwtHelpers } from "../helpers/jwtHelpers";
import config from "../config";
import { Secret } from "jsonwebtoken";
import { User } from "../modules/auth/auth.model";

const forgetVerify = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          "forget password verify token needed"
        );
      }

      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.otp_secret.forget_password_secret as Secret
      );
    
      const user = await User.findOne({
        _id: verifiedUser.id,
      });

      if (!user) {
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          "This user is not found !"
        );
      }
      if (roles.length && !roles.includes(verifiedUser.role)) {
        throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden!");
      }

      req.user = verifiedUser;
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default forgetVerify;
