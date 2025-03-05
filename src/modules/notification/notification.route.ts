import express from "express"

import validateRequest from "../../middlewares/validateRequest";
import { NoticationValidation } from "./notification.validation";
import { NotificationController } from "./notification.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

export const NotificationRoutes = router;
// router.post(
//   "/",
//   validateRequest(NoticationValidation.createNoticationSchema),
//   NotificationController.createNotification
// );

router.get("/", auth(),NotificationController.getUserNotification);
router.patch("/update-many", NotificationController.updateMessageNotification);
router.patch("/:id", auth(),NotificationController.updateNotification);
