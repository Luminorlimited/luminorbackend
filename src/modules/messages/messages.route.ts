import express from "express";
import { MessageController } from "./messages.controller";

import validateRequest from "../../middlewares/validateRequest";
import { MessageValidation } from "./messages.validation";
import auth from "../../middlewares/auth";

const router = express.Router();

export const MessageRoutes = router;
router.post(
  "/",
  validateRequest(MessageValidation.CreateMessageSchema),

  MessageController.createMessage
);
router.get(
  "/",

  MessageController.getMessages
);

router.get("/get-convirsation-list",auth(),MessageController.getConversationLists)