"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    sender: {
        type: String,
        required: true,
    },
    recipient: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        defaul: null,
    },
    media: {
        type: String,
        default: null,
    },
    meetingLink: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.Message = (0, mongoose_1.model)("Message", messageSchema);
