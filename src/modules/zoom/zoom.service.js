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
    startUrl: response.data.start_url,
  };
}

// Helper to get Zoom userId (email or userId)
async function getZoomUserId() {
  const token = await getAccessToken();
  const response = await axios.get("https://api.zoom.us/v2/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(response.data.id);
  return response.data.id;
}

// Controller to get ZAK token
export const getZakToken = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const accessToken = await getAccessToken();
    const response = await axios.get(
      `https://api.zoom.us/v2/users/${userId}/token?type=zak`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const zak = response.data.token;
    return res.status(200).json({ zak });
  } catch (error) {
    console.error(
      "Error fetching ZAK token:",
      error.response?.data || error.message
    );
    return res.status(500).json({ message: "Failed to fetch ZAK token" });
  }
};
