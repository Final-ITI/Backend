import jwt from "jsonwebtoken";

export function generateZoomSignature(meetingNumber, role) {
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;

  const payload = {
    sdkKey: process.env.ZOOM_SDK_KEY,
    mn: meetingNumber,
    role: role, // 0 = attendee, 1 = host
    iat: iat,
    exp: exp,
    appKey: process.env.ZOOM_SDK_KEY,
    tokenExp: exp,
  };

  return jwt.sign(payload, process.env.ZOOM_SDK_SECRET, {
    algorithm: "HS256",
  });
}
