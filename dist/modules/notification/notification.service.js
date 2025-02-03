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
exports.NotificationService = void 0;
const notificationStatus_1 = require("../../enums/notificationStatus");
const notification_model_1 = require("./notification.model");
// const createNotification = async (payload: INotification, event: string) => {
//   const result = await Notification.create(payload);
//   let count;
//   if (payload.type === ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE) {
//     count = await MessageService.countMessages(payload.recipient);
//   }
//   else if(payload.type===ENUM_NOTIFICATION_TYPE.OFFER){
//      count=await OfferService.countOffer(payload.recipient)
//   }
//   // if (result) {
//   //   io.emit(event, {
//   //     toEmail: payload.recipient,
//   //     message: payload.message,
//   //     fromEmail: payload.sender,
//   //     type: payload.type,
//   //     status: payload.status,
//   //     count: count,
//   //   });
//   // }
//   return result;
// };
const getUserNotification = (recipient, status, type) => __awaiter(void 0, void 0, void 0, function* () {
    let filters = {};
    if (status && recipient && type) {
        filters.recipient = recipient;
        filters.status = status;
        filters.type = type;
    }
    else if (status && recipient) {
        filters.recipient = recipient;
        filters.status = status;
    }
    else if (recipient && type) {
        filters.recipient = recipient;
        filters.type = type;
    }
    else if (recipient) {
        filters.recipient = recipient;
    }
    const result = yield notification_model_1.Notification.find(filters).sort({ createdAt: -1 });
    return result;
});
const updateNotification = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.findOneAndUpdate({ _id: id }, { status: notificationStatus_1.ENUM_NOTIFICATION_STATUS.SEEN }, {
        new: true,
    });
    return result;
});
const updateMessageNotification = (ids) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.updateMany({
        _id: { $in: ids },
    }, { status: notificationStatus_1.ENUM_NOTIFICATION_STATUS.SEEN }, {
        new: true,
    });
    return result;
});
const updateSingleUserMessageNotification = (sender, recipient) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.updateMany({
        recipient: recipient,
        sender: sender,
        type: notificationStatus_1.ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE
    }, { status: notificationStatus_1.ENUM_NOTIFICATION_STATUS.SEEN }, {
        new: true,
    });
    return result;
});
exports.NotificationService = {
    // createNotification,
    getUserNotification,
    updateNotification,
    updateMessageNotification,
    updateSingleUserMessageNotification
};
