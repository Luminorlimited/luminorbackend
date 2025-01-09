import axios from "axios";
import config from "../../config";
async function getZoomToken() {
  try {

    // console.log(    `${config.zoom.zoomClientId}:${config.zoom.zoomClientSecret}`)
    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=client_credentials&account_id=${config.zoom.zoomAccountId}`,
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
    console.log(response.data)
    return response.data.access_token;
  } catch (error:any) {
    console.error("Error fetching Zoom token:", error.response?.data || error.message);
    throw new Error("Failed to retrieve Zoom access token.");
  }
}

async function createZoomMeeting() {
  try {
    const token = await getZoomToken();
    console.log(token,"check token")

    const meetingResponse = await axios.post(
      `https://api.zoom.us/v2/users/udoyrafeul@gmail.com/meetings`,
      {
        topic: "Luminor Client Meeting",
        type: 2,
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

    console.log("Meeting Created:", meetingResponse.data);
  } catch (error:any) {
    console.error("Error creating meeting:", error.response?.data || error.message);
  }
}

// Execute the function


export const zoomService={
  createZoomMeeting
}
