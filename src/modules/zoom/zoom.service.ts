import axios from "axios";
import config from "../../config";
async function getZoomToken() {
  try {
    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${config.zoom.zoomAccountId}`,
      null,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.zoom.zoomClientId}:${config.zoom.zoomClientSecret}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.access_token;
  } catch (error: any) {
    console.error(
      "Error fetching Zoom token:",
      error.response?.data || error.message
    );
    throw new Error("Failed to retrieve Zoom access token.");
  }
}

async function createZoomMeeting() {
  try {
    const token = await getZoomToken();
    const meetingResponse = await axios.post(
      `https://api.zoom.us/v2/users/me/meetings`,
      {
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
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return {
      start_url: meetingResponse.data.start_url,
      join_url: meetingResponse.data.join_url,
    };
  } catch (error: any) {
    console.error(
      "Error creating meeting:",
      error.response?.data || error.message
    );
  }
}
export const zoomService = {
  createZoomMeeting,
};
