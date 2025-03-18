import express from "express";

import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { ENUM_USER_ROLE } from "../../enums/user";
import { multerUpload } from "../../middlewares/multer";

const router = express.Router();
export const AuthRoute = router;

router.post(
  "/signIn",

  AuthController.loginUser
);

router.post("/admin-login");
router.post("/create-admin", AuthController.createAdmin);
router.get("/get-profile", auth(), AuthController.getProfile);
router.post("/otp-enter", AuthController.enterOtp);

router.get("/get-all-users", AuthController.getAllUsers);
router.patch(
  "/update-admin",

  auth(ENUM_USER_ROLE.ADMIN),

  AuthController.updateAdmin
);
router.patch(
  "/update-admin-profile-image",
  multerUpload.single("profileUrl"),
  auth(ENUM_USER_ROLE.ADMIN),

  AuthController.updateAdminProfilePic
);
router.get(
  "/get-all-retireProfessionals",
  AuthController.getAllRetireProfiessional
);

router.get("/get-all-clients", AuthController.getAllClients);
router.patch(
  "/update-cover-photo",
  multerUpload.single("coverPhoto"),
  auth(),
  AuthController.updateCoverPhoto
);
router.get("/get-single-user/:id", AuthController.getSingleUserById);
router.patch("/delete-user/:id", AuthController.delteUser);
router.patch("/update-status/:id", AuthController.updateUserStatus);
router.post("/forget-password", auth(), AuthController.forgotPassword);
router.patch("/reset-password", auth(), AuthController.resetPassword);
router.get("/search-service", auth(), AuthController.searchService);
