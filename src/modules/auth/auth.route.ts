import express from "express";


import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { ENUM_USER_ROLE } from "../../enums/user";

const router = express.Router();
export const AuthRoute = router;




router.post(
  "/signIn",
 

  AuthController.loginUser
);
router.get("/get-profile",  auth(ENUM_USER_ROLE.CLIENT,ENUM_USER_ROLE.RETIREPROFESSIONAL), AuthController.getProfile)
router.post("/otp-enter", AuthController.enterOtp);
router.get("/get-single-user/:id",AuthController.getSingleUserById)

router.get("/get-all-users",AuthController.getAllUsers)

router.get("/get-all-retireProfessionals",AuthController.getAllRetireProfiessional)

router.get("/get-all-clients",AuthController.getAllClients)