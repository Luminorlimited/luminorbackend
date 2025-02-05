import express from "express";
import { MessageController } from "./messages.controller";

import validateRequest from "../../middlewares/validateRequest";
import { MessageValidation } from "./messages.validation";
import auth from "../../middlewares/auth";
import { multerUpload } from "../../middlewares/multer";

const router = express.Router();

export const MessageRoutes = router;
router.post(
  "/",

  validateRequest(MessageValidation.CreateMessageSchema),

  MessageController.createMessage
);
router.get("/", auth(), MessageController.getMessages);
router.post(
  "/file-upload",
  multerUpload.single("file"),
  MessageController.uploadMessagefile
);

router.get(
  "/get-convirsation-list",
  auth(),
  MessageController.getConversationLists
);

router.get("/get-single-messages/:id",auth(),MessageController.getSingleMessages)