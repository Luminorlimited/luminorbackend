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
exports.MessageService = void 0;
const http_status_codes_1 = require("http-status-codes");
const notificationStatus_1 = require("../../enums/notificationStatus");
const handleApiError_1 = __importDefault(require("../../errors/handleApiError"));
const server_1 = require("../../server");
const uploadTos3_1 = require("../../utilitis/uploadTos3");
const convirsation_model_1 = require("../convirsation/convirsation.model");
const notification_model_1 = require("../notification/notification.model");
const messages_model_1 = require("./messages.model");
const createMessage = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // const [sender, recipient] = await Promise.all([
    //   User.findOne({ email: payload.sender }),
    //   User.findOne({ email: payload.recipient }),
    // ]);
    // if (!sender || !recipient) {
    //   throw new Error("Sender or recipient not found.");
    // }
    // console.log(payload, "check payload from create message service");
    let checkRoom = yield convirsation_model_1.Convirsation.findOne({
        $and: [
            { $or: [{ user1: payload.sender }, { user1: payload.recipient }] },
            { $or: [{ user2: payload.sender }, { user2: payload.recipient }] },
        ],
    });
    if (!checkRoom) {
        checkRoom = yield convirsation_model_1.Convirsation.create({
            user1: payload.sender,
            user2: payload.recipient,
            lastMessage: "",
        });
    }
    const data = {
        sender: payload.sender,
        recipient: payload.recipient,
        message: payload.message || null,
        meetingLink: payload.meetingLink || null,
        media: payload.media || null,
        room: checkRoom._id,
    };
    const message = yield messages_model_1.Message.create(data);
    let lastMessageContent = payload.message
        ? payload.message
        : payload.media
            ? "📷 Image"
            : payload.meetingLink
                ? "🔗 Meeting Link"
                : "";
    let updateFields = {
        lastMessageTimestamp: message.createdAt,
        lastMessage: lastMessageContent,
    };
    const recipientInChat = server_1.userInChat.get(payload === null || payload === void 0 ? void 0 : payload.recipient.toString());
    if (payload.sender.toString() === checkRoom.user1.toString()) {
        if (!recipientInChat || recipientInChat !== payload.sender.toString()) {
            updateFields.$inc = { user2UnseenCount: 1 };
            updateFields.$push = { user2UnseenMessages: message._id };
        }
    }
    else {
        if (!recipientInChat || recipientInChat !== payload.sender.toString()) {
            updateFields.$inc = { user1UnseenCount: 1 };
            updateFields.$push = { user1UnseenMessages: message._id };
        }
    }
    yield convirsation_model_1.Convirsation.findByIdAndUpdate(checkRoom._id, updateFields, {
        new: true,
    });
    return message;
});
const getMessages = (senderId, recipientId, loggedInUser) => __awaiter(void 0, void 0, void 0, function* () {
    // const users = await User.find({ email: { $in: [senderId, recipientId] } });
    // if (users.length < 2) throw new Error("Sender or recipient not found.");
    // const [sender, recipient] = users;
    console.log(senderId, "check sender id");
    console.log(recipientId, "chekc recipeint id");
    const messages = yield messages_model_1.Message.find({
        $or: [
            { sender: senderId, recipient: recipientId },
            { sender: recipientId, recipient: senderId },
        ],
    })
        .sort({ createdAt: 1 })
        .populate("sender", "name email profileUrl")
        .populate("recipient", "name email profileUrl");
    if (!messages.length)
        return [];
    const conversationRoom = yield convirsation_model_1.Convirsation.findById(messages[0].room)
        .populate("user1", "name email profileUrl")
        .populate("user2", "name email profileUrl");
    if (!conversationRoom)
        throw new handleApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Room not found");
    const isUser1 = loggedInUser === conversationRoom.user1._id.toString();
    const unseenMessageIds = isUser1
        ? conversationRoom.user1UnseenMessages
        : conversationRoom.user2UnseenMessages;
    if (unseenMessageIds.length) {
        yield messages_model_1.Message.updateMany({ _id: { $in: unseenMessageIds } }, { isUnseen: false });
        yield convirsation_model_1.Convirsation.findByIdAndUpdate(conversationRoom.id, {
            $set: isUser1
                ? { user1UnseenMessages: [], user1UnseenCount: 0 }
                : { user2UnseenMessages: [], user2UnseenCount: 0 },
        });
    }
    const userDetails = [
        conversationRoom.user1,
        conversationRoom.user2,
    ].map((user) => ({
        name: `${user.name.firstName} ${user.name.lastName}`,
        email: user.email,
        profileUrl: user.profileUrl || null,
    }));
    return { userDetails, messages };
});
const getSingleMessages = (sender, recipient) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = yield messages_model_1.Message.find({
        $or: [
            { sender: sender, recipient: recipient },
            { sender: recipient, recipient: sender },
        ],
    }).sort({ createdAt: -1 });
    return messages;
});
const getConversationLists = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // const user = await User.findOne({ email });
    // if (!user) {
    //   throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    // }
    const conversations = yield convirsation_model_1.Convirsation.find({
        $or: [{ user1: id }, { user2: id }],
    })
        .populate("user1", "email name profileUrl _id")
        .populate("user2", "email name profileUrl _id")
        .sort({ lastMessageTimestamp: -1 });
    const conversationList = conversations.map((conversation) => {
        const isUser1 = conversation.user1._id.toString() === id.toString();
        const otherUser = isUser1 ? conversation.user2 : conversation.user1;
        const unseenMessageCount = isUser1
            ? conversation.user1UnseenCount
            : conversation.user2UnseenCount;
        return {
            id: otherUser._id,
            email: otherUser.email,
            name: `${otherUser.name.firstName.trim()} ${otherUser.name.lastName.trim()}`,
            profileUrl: otherUser.profileUrl || null,
            isOnline: server_1.onlineUsers.get(otherUser.id) || false,
            room: conversation._id,
            lastMessage: conversation.lastMessage,
            lastMessageTimestamp: conversation.lastMessageTimestamp,
            unseenMessageCount,
        };
    });
    return conversationList;
});
const uploadMessagefile = (file) => __awaiter(void 0, void 0, void 0, function* () {
    const fileUrl = yield (0, uploadTos3_1.uploadFileToSpace)(file, "message-file");
    return fileUrl;
});
const countMessages = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const totalUnseen = yield notification_model_1.Notification.find({
        recipient: email,
        status: notificationStatus_1.ENUM_NOTIFICATION_STATUS.UNSEEN,
        type: notificationStatus_1.ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE,
    }).select("_id");
    const filterIds = totalUnseen.map((message) => message._id.toString());
    return { count: totalUnseen.length, totalUnseenId: filterIds };
});
const countMessageWithRecipient = (sender, recepient) => __awaiter(void 0, void 0, void 0, function* () {
    const totalUnseen = yield notification_model_1.Notification.find({
        sender: sender,
        recipient: recepient,
        status: notificationStatus_1.ENUM_NOTIFICATION_STATUS.UNSEEN,
        type: notificationStatus_1.ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE,
    });
    const filterIds = totalUnseen.map((message) => message._id.toString());
    return { count: totalUnseen.length, totalUnseenId: filterIds };
});
exports.MessageService = {
    createMessage,
    getMessages,
    getConversationLists,
    uploadMessagefile,
    countMessages,
    countMessageWithRecipient,
    getSingleMessages,
};
