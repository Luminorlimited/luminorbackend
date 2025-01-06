import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/handleApiError";
import axios from "axios";
import config from "../../config";


import base64 from "base-64"

 
// const base64 = Buffer.from( `${config.zoom.zoomClientId}:${config.zoom.zoomClientSecret}`).toString('base64');
// console.log(base64,"check base64")
// async function checkTokenExpiry(tokenData:any) {
//     if (!tokenData || !tokenData.expires_in) {
//       throw new Error("Invalid token data or no 'expires_in' value found.");
//     }
  
//     // Get the current timestamp in seconds
//     const currentTime = Math.floor(Date.now() / 1000);
  
//     // Calculate the expiration timestamp
//     const expiryTime = tokenData.issued_at + tokenData.expires_in;
  
//     if (currentTime >= expiryTime) {
//       console.log("Token has expired.");
//       return true;
//     } else {
//       console.log("Token is still valid.");
//       return false;
//     }
//   }

async function getZoomToken() {

    // console.log(config.zoom.zoomAccountId)
  try {
    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=client_credentials&account_id=${config.zoom.zoomAccountId}`,
      null, // No body is required
      {
        headers: {
          Authorization: `Basic ${base64.encode(`${config.zoom.zoomClientId}:${config.zoom.zoomClientSecret}`)}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // console.log('Token Response:', response.data);
    return response.data;
  } catch (error:any) {
    console.error('Error:', error.response?.data || error.message);
  }
}
const createZoomMeeting = async (accessToken: string) => {
    console.log(accessToken,"check access token")
    try {
      const response = await axios.post(
        `https://api.zoom.us/v2/users/me/meetings`,
        {
          topic: "Team Meeting", 
          type: 1, // Scheduled meeting
          start_time: new Date().toLocaleDateString(), 
          duration: 30,
          timezone: "UTC",
          settings: {
            host_video: true,
            participant_video: true,
          },
          
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
  
    //   console.log("Zoom Meeting Created:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "Error creating Zoom meeting:",
        error.response?.data || error.message
      );
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error creating Zoom meeting"
      );
    }
  };
  

  const createZoomLink = async () => {
    try {
      const tokenData = await getZoomToken();
    //   console.log(tokenData.access_token,"check token data")
      if (!tokenData?.access_token) {
        throw new Error("Access token not retrieved");
      }
    //  const result= checkTokenExpiry(tokenData.access_data)
    //  console.log(result,"check is expired")
      const meetingDetails = await createZoomMeeting(tokenData.access_token);
      console.log("Meeting Details:", meetingDetails);
      return meetingDetails;
    } catch (error: any) {
      console.error(
        "Error creating Zoom link:",
        error.response?.data || error.message
      );
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error creating Zoom link"
      );
    }
  };
// Zoom Service
const zoomService = {
  createZoomLink,
};

export default zoomService;
