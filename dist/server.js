"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("./config"));
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const socket_io_1 = require("socket.io");
const messages_model_1 = require("./modules/messages/messages.model");
const notification_model_1 = require("./modules/notification/notification.model");
const notificationStatus_1 = require("./enums/notificationStatus");
const calculateTotalPrice_1 = require("./utilitis/calculateTotalPrice");
const generateOfferPdf_1 = require("./utilitis/generateOfferPdf");
const offer_model_1 = require("./modules/offers/offer.model");
const uploadTos3_1 = require("./utilitis/uploadTos3");
const zoom_service_1 = require("./modules/zoom/zoom.service");
const options = {
    autoIndex: true,
};
const httpServer = (0, http_1.createServer)(app_1.default);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    },
    transports: ["polling", "websocket"],
    pingInterval: 25000,
    pingTimeout: 60000,
    upgradeTimeout: 30000,
});
// Store socket IDs for users
const users = {};
io.on("connection", (socket) => {
    // Register the user with their email and socket ID
    socket.on("register", (data) => {
        const { email } = JSON.parse(data);
        // console.log(email);
        users[email] = socket.id;
        console.log(users[email]);
    });
    // Private messaging between users6
    socket.on("privateMessage", (data) => __awaiter(void 0, void 0, void 0, function* () {
        // console.log(users);
        const { toEmail, message = null, fromEmail, media } = JSON.parse(data);
        const toSocketId = users[toEmail];
        // console.log(toSocketId);
        // const fromSocketId = users[fromEmail];
        if (!fromEmail) {
            socket.send(JSON.stringify({ error: "email is required" }));
        }
        try {
            let mediaUrl = null;
            if (media) {
                let mediaBuffer = Buffer.from(media, "base64");
                mediaUrl = yield (0, uploadTos3_1.uploadFileToSpace)(mediaBuffer, "privateMessageFile");
            }
            const savedMessage = yield messages_model_1.Message.create({
                sender: fromEmail,
                message: message,
                medai: mediaUrl,
                recipient: toEmail,
            });
            if (toSocketId) {
                socket.to(toSocketId).emit("privateMessage", {
                    message: savedMessage,
                });
            }
            socket.emit("privateMessage", {
                message: savedMessage,
            });
        }
        catch (error) { }
    }));
    // const message = {
    //   toEmail: "b@mail.com",
    //   message: "Hello, this is a test message",
    //   fromEmail: "a@mail.com",
    // };
    // socket.emit("privateMessage", JSON.stringify(message))
    // Notification event
    socket.on("notification", (_a) => __awaiter(void 0, [_a], void 0, function* ({ toEmail, message, fromEmail, type }) {
        const toSocketId = users[toEmail];
        // const fromSocketId = users[fromEmail];
        if (!fromEmail) {
            socket.send(JSON.stringify({ error: "email is required" }));
        }
        try {
            const notification = yield notification_model_1.Notification.create({
                recipient: toEmail,
                sender: fromEmail,
                message: message,
                status: notificationStatus_1.ENUM_NOTIFICATION_STATUS.UNSEEN,
                type: type,
            });
            const notificationResponse = {
                success: true,
                statusCode: 200,
                message: "Notification saved successfully",
                data: notification.toObject(),
            };
            // const notificationId = notificationData._id;
            if (toSocketId) {
                socket.to(toSocketId).emit("notification", {
                    from: fromEmail,
                    message,
                    type: type,
                });
            }
        }
        catch (error) {
            socket.emit("notificationError", "Failed to create notification");
        }
    }));
    socket.on("sendOffer", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { toEmail, offer, fromEmail } = JSON.parse(data);
        const toSocketId = users[toEmail];
        // console.log(data,"from send offer")
        // console.log(offer,"check offer")
        console.log(toSocketId, "check socket id to email");
        try {
            offer.totalPrice = (0, calculateTotalPrice_1.calculateTotalPrice)(offer);
            const offerPDFPath = yield (0, generateOfferPdf_1.generateOfferPDF)(offer);
            offer.orderAgreementPDF = offerPDFPath;
            const newOffer = yield offer_model_1.Offer.create(offer);
            // console.log(newOffer,"check new offer")
            if (toSocketId) {
                socket.to(toSocketId).emit("sendOffer", {
                    from: fromEmail,
                    offer: newOffer,
                });
            }
        }
        catch (error) {
            socket.emit("sendoffer error ", "Failed to create effor");
        }
    }));
    socket.on("createZoomMeeting", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { fromEmail, toEmail } = JSON.parse(data);
        console.log(data, "from zoom meeting");
        const toSocketId = users[toEmail];
        try {
            const meeting = yield zoom_service_1.zoomService.createZoomMeeting();
            if (!meeting || !meeting.start_url || !meeting.join_url) {
                throw new Error("Invalid Zoom meeting data");
            }
            const { start_url, join_url } = meeting;
            const savedMessage = yield messages_model_1.Message.create({
                sender: fromEmail,
                recipient: toEmail,
                message: "Zoom meeting invitation",
                media: null,
                meetingLink: join_url,
            });
            console.log(savedMessage, "check saved message");
            console.log(toSocketId, "check socket io");
            if (toSocketId) {
                socket.to(toSocketId).emit("createZoomMeeting", {
                    from: fromEmail,
                    join_url,
                });
            }
            socket.emit("createZoomMeeting", {
                start_url,
            });
        }
        catch (error) {
            console.error("Error creating Zoom meeting:", error);
            socket.emit("zoomMeetingError", "Failed to create Zoom meeting");
        }
    }));
    // Handle disconnection of users
    socket.on("disconnect", (reason) => {
        for (const email in users) {
            if (users[email] === socket.id) {
                delete users[email];
                break;
            }
        }
    });
    socket.on("error", (error) => { });
});
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            yield mongoose_1.default.connect("mongodb+srv://luminor:BYcHOYLQI2eiZ9IU@cluster0.v0ciw.mongodb.net/luminor?retryWrites=true&w=majority&appName=Cluster0", options);
            // console.log(config.database_url, "check data base url");
            console.log("Connected to MongoDB successfully.");
            // Start the server
            httpServer.listen(config_1.default.port, () => {
                console.log(`Server running at port ${config_1.default.port}`);
            });
        }
        catch (error) {
            console.error("Failed to connect to MongoDB:", error);
            process.exit(1);
        }
    });
}
bootstrap();
