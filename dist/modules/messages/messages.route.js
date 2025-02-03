"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRoutes = void 0;
const express_1 = __importDefault(require("express"));
const messages_controller_1 = require("./messages.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const messages_validation_1 = require("./messages.validation");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const multer_1 = require("../../middlewares/multer");
const router = express_1.default.Router();
exports.MessageRoutes = router;
router.post("/", (0, validateRequest_1.default)(messages_validation_1.MessageValidation.CreateMessageSchema), messages_controller_1.MessageController.createMessage);
router.get("/", (0, auth_1.default)(), messages_controller_1.MessageController.getMessages);
router.post("/file-upload", multer_1.multerUpload.single("file"), messages_controller_1.MessageController.uploadMessagefile);
router.get("/get-convirsation-list", (0, auth_1.default)(), messages_controller_1.MessageController.getConversationLists);
