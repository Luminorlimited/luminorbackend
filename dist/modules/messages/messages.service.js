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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const user_1 = require("../../enums/user");
const auth_model_1 = require("../auth/auth.model");
const client_model_1 = require("../client/client.model");
const professional_model_1 = require("../professional/professional.model");
const messages_model_1 = require("./messages.model");
const createMessage = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield messages_model_1.Message.create(payload);
    return result;
});
const getMessages = (senderId, recipientId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(senderId, recipientId);
    const messages = yield messages_model_1.Message.find({
        $or: [
            { sender: senderId, recipient: recipientId },
            { sender: recipientId, recipient: senderId },
            { sender: { $regex: `^${senderId}$`, $options: "i" } },
            { sender: { $regex: `^${recipientId}$`, $options: "i" } },
            { recipient: { $regex: `^${senderId}$`, $options: "i" } },
            { recipient: { $regex: `^${recipientId}$`, $options: "i" } },
        ],
    }).sort({ createdAt: 1 });
    console.log(messages, "check messages");
    const emails = new Set();
    messages.forEach((msg) => {
        emails.add(msg.sender);
        emails.add(msg.recipient);
    });
    const users = yield auth_model_1.User.find({ email: { $in: Array.from(emails) } }).select("email name role");
    const userDetails = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
        let profileUrl = null;
        if (user.role === user_1.ENUM_USER_ROLE.CLIENT) {
            const client = yield client_model_1.Client.findOne({ client: user._id }).select("profileUrl");
            profileUrl = (client === null || client === void 0 ? void 0 : client.profileUrl) || null;
        }
        else if (user.role === user_1.ENUM_USER_ROLE.RETIREPROFESSIONAL) {
            const retireProfessional = yield professional_model_1.RetireProfessional.findOne({ retireProfessional: user._id }).select("profileUrl");
            profileUrl = (retireProfessional === null || retireProfessional === void 0 ? void 0 : retireProfessional.profileUrl) || null;
        }
        return {
            email: user.email,
            name: `${user.name.firstName} ${user.name.lastName}`,
            profileUrl,
            userId: user._id
        };
    })));
    return { userDetails, messages };
});
const getConversationLists = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // console.log(user.email, "check email");
        const messages = yield messages_model_1.Message.find({
            $or: [
                { sender: { $regex: `^${user.email}$`, $options: "i" } },
                { recipient: { $regex: `^${user.email}$`, $options: "i" } },
            ],
        }).sort({ createdAt: -1 });
        ;
        console.log(messages, "check messages");
        const emails = new Set();
        messages.forEach((msg) => {
            emails.add(msg.sender);
            emails.add(msg.recipient);
        });
        emails.delete(user.email);
        console.log(emails, "check emails");
        const users = yield auth_model_1.User.find({ email: { $in: Array.from(emails) } }).select("email name role");
        console.log(users, "check users");
        const userDetails = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            let profileUrl = null;
            if (user.role === user_1.ENUM_USER_ROLE.CLIENT) {
                const client = yield client_model_1.Client.findOne({ client: user._id }).select("profileUrl");
                profileUrl = (client === null || client === void 0 ? void 0 : client.profileUrl) || null;
            }
            else if (user.role === user_1.ENUM_USER_ROLE.RETIREPROFESSIONAL) {
                const retireProfessional = yield professional_model_1.RetireProfessional.findOne({ retireProfessional: user._id }).select("profileUrl");
                profileUrl = (retireProfessional === null || retireProfessional === void 0 ? void 0 : retireProfessional.profileUrl) || null;
            }
            return {
                email: user.email,
                name: `${user.name.firstName} ${user.name.lastName}`,
                profileUrl,
            };
        })));
        return userDetails;
    }
    catch (error) {
        console.error("Error fetching conversation list:", error);
        throw error;
    }
});
exports.MessageService = {
    createMessage,
    getMessages,
    getConversationLists
};
