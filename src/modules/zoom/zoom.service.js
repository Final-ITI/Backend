// services/zoom.service.js
import axios from "axios";

async function getAccessToken() {
  const response = await axios.post("https://zoom.us/oauth/token", null, {
    params: {
      grant_type: "account_credentials",
      account_id: process.env.ZOOM_API_ACCOUNT_ID,
    },
    auth: {
      username: process.env.ZOOM_API_CLIENT_ID,
      password: process.env.ZOOM_API_CLIENT_SECRET,
    },
  });
  return response.data.access_token;
}

export async function createZoomMeeting({
  topic,
  start_time,
  duration,
  timezone,
  password,
}) {
  const token = await getAccessToken();
  const meetingData = {
    topic,
    type: 2,
    start_time,
    duration,
    timezone,
    password,
    settings: {
      join_before_host: true,
      mute_upon_entry: true,
      waiting_room: true,
    },
  };
  const response = await axios.post(
    "https://api.zoom.us/v2/users/me/meetings",
    meetingData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    meetingId: response.data.id,
    password: response.data.password,
    join_url: response.data.join_url,
  };
}
