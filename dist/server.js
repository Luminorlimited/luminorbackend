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
exports.userInChat = exports.onlineUsers = exports.users = exports.io = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("./config"));
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const socket_io_1 = require("socket.io");
const messages_model_1 = require("./modules/messages/messages.model");
const calculateTotalPrice_1 = require("./utilitis/calculateTotalPrice");
const generateOfferPdf_1 = require("./utilitis/generateOfferPdf");
const zoom_service_1 = require("./modules/zoom/zoom.service");
const offer_service_1 = require("./modules/offers/offer.service");
const messages_service_1 = require("./modules/messages/messages.service");
const options = {
    autoIndex: true,
};
const httpServer = (0, http_1.createServer)(app_1.default);
exports.io = new socket_io_1.Server(httpServer, {
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
exports.users = {};
exports.onlineUsers = new Map();
exports.userInChat = new Map();
exports.io.on("connection", (socket) => {
    socket.on("register", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { email } = JSON.parse(data);
        exports.users[email] = socket.id;
        exports.onlineUsers.set(email, true);
        const conversationList = yield messages_service_1.MessageService.getConversationLists(email);
        socket.emit("conversation-list", conversationList);
    }));
    socket.on("privateMessage", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { toEmail, message, fromEmail, media, mediaUrl } = JSON.parse(data);
        if (!fromEmail) {
            return socket.send(JSON.stringify({ error: "email is required" }));
        }
        const toSocketId = exports.users[toEmail];
        const recipientInChatWith = exports.userInChat.get(toEmail);
        try {
            const isUnseen = recipientInChatWith === fromEmail ? false : true;
            const savedMessage = yield messages_service_1.MessageService.createMessage({
                sender: fromEmail,
                message: message || null,
                media: mediaUrl || null,
                recipient: toEmail,
                isUnseen: isUnseen,
            });
            // const [fromEmailConversationList, toEmailConversationList] =
            //   await Promise.all([
            //     MessageService.getConversationLists(fromEmail),
            //     toEmail ? MessageService.getConversationLists(toEmail) : null,
            //   ]);
            const toEmailConversationList = yield messages_service_1.MessageService.getConversationLists(toEmail);
            const populatedMessage = yield messages_model_1.Message.findById(savedMessage._id)
                .populate({ path: "sender", select: "name email _id" })
                .populate({ path: "recipient", select: "name email _id" })
                .lean();
            // socket.emit("privateMessage", {
            //   message: populatedMessage,
            //   fromEmail: fromEmail,
            // });
            // socket.emit("conversation-list", fromEmailConversationList);
            if (toSocketId) {
                socket.to(toSocketId).emit("privateMessage", {
                    message: populatedMessage,
                    fromEmail: fromEmail,
                    toEmail: toEmail,
                });
                if (toEmailConversationList) {
                    socket
                        .to(toSocketId)
                        .emit("conversation-list", toEmailConversationList);
                }
            }
        }
        catch (error) {
            console.error("Error sending private message:", error);
        }
    }));
    socket.on("userInChat", (data) => {
        const { userEmail, chattingWith } = JSON.parse(data);
        if (chattingWith) {
            exports.userInChat.set(userEmail, chattingWith);
        }
        else {
            exports.userInChat.delete(userEmail);
        }
    });
    socket.on("sendOffer", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { toEmail, offer, fromEmail } = JSON.parse(data);
        const toSocketId = exports.users[toEmail];
        try {
            offer.totalPrice = (0, calculateTotalPrice_1.calculateTotalPrice)(offer);
            const offerPDFPath = yield (0, generateOfferPdf_1.generateOfferPDF)(offer);
            offer.orderAgreementPDF = offerPDFPath;
            const totalOffer = Object.assign(Object.assign({}, offer), { clientEmail: toEmail, professionalEmail: fromEmail });
            const newOffer = yield offer_service_1.OfferService.createOffer(totalOffer);
            if (toSocketId) {
                socket.to(toSocketId).emit("sendOffer", {
                    from: fromEmail,
                    offer: newOffer,
                });
            }
            socket.emit("sendOfferSuccess", {
                message: "Offer sent successfully!",
                statusCode: 200,
            });
        }
        catch (error) {
            socket.emit("sendOfferError", {
                message: error.message || "Failed to create offer",
                statusCode: error.statusCode || 500,
            });
        }
    }));
    socket.on("createZoomMeeting", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { fromEmail, toEmail } = JSON.parse(data);
        const toSocketId = exports.users[toEmail];
        try {
            const meeting = yield zoom_service_1.zoomService.createZoomMeeting();
            if (!meeting || !meeting.start_url || !meeting.join_url) {
                throw new Error("Invalid Zoom meeting data");
            }
            const { start_url, join_url } = meeting;
            const savedMessage = yield messages_service_1.MessageService.createMessage({
                sender: fromEmail,
                recipient: toEmail,
                message: join_url,
                media: "",
                meetingLink: start_url,
                isUnseen: false,
            });
            if (toSocketId) {
                socket.to(toSocketId).emit("createZoomMeeting", {
                    from: fromEmail,
                    savedMessage,
                });
            }
            socket.emit("createZoomMeeting", {
                savedMessage,
            });
        }
        catch (error) {
            console.error("Error creating Zoom meeting:", error);
            socket.emit("zoomMeetingError", "Failed to create Zoom meeting");
        }
    }));
    socket.on("disconnect", (reason) => __awaiter(void 0, void 0, void 0, function* () {
        let email = "";
        for (let [userEmail, isOnline] of exports.onlineUsers) {
            if (socket.id === exports.users[userEmail]) {
                email = userEmail;
                break;
            }
        }
        if (email) {
            exports.onlineUsers.set(email, false);
            delete exports.users[email];
        }
    }));
    socket.on("error", (error) => { });
});
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect("mongodb+srv://luminor:BYcHOYLQI2eiZ9IU@cluster0.v0ciw.mongodb.net/luminor?retryWrites=true&w=majority&appName=Cluster0", options);
            console.log("Connected to MongoDB successfully.");
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
