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
exports.zoomService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../../config"));
function getZoomToken() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // console.log(    `${config.zoom.zoomClientId}:${config.zoom.zoomClientSecret}`)
            const response = yield axios_1.default.post(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${config_1.default.zoom.zoomAccountId}`, null, {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${config_1.default.zoom.zoomClientId}:${config_1.default.zoom.zoomClientSecret}`).toString("base64")}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
            // console.log(response.data);
            return response.data.access_token;
        }
        catch (error) {
            console.error("Error fetching Zoom token:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw new Error("Failed to retrieve Zoom access token.");
        }
    });
}
function createZoomMeeting() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const token = yield getZoomToken();
            // console.log(token, "check token");
            const meetingResponse = yield axios_1.default.post(`https://api.zoom.us/v2/users/me/meetings`, {
                topic: "Luminor Client Meeting",
                type: 1,
                start_time: new Date().toISOString(),
                duration: 60,
                timezone: "UTC",
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: false,
                    mute_upon_entry: true,
                },
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            // console.log("Meeting Created:", meetingResponse.data);
            return {
                start_url: meetingResponse.data.start_url,
                join_url: meetingResponse.data.join_url,
            };
        }
        catch (error) {
            console.error("Error creating meeting:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        }
    });
}
// Execute the function
exports.zoomService = {
    createZoomMeeting,
};
