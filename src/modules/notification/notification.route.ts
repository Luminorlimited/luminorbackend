import express from "express";

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

router.get("/", auth(), NotificationController.getUserNotification);
router.get(
  "/get-message-notification",
  auth(),
  NotificationController.getMessageNotification
);
router.get("/message-count/:id", NotificationController.messageCount);
router.get(
  "/notification-count/:id",
  NotificationController.otherNotificationCount
);
router.patch("/update-many", NotificationController.updateMessageNotification);
router.patch("/:id", auth(), NotificationController.updateNotification);
