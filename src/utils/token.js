
import jwt from "jsonwebtoken";


// Utility function to generate JWT tokens
export const generateTokens = (userId, userType, tenantId = null) => {
  const accessToken = jwt.sign(
    {
      userId,
      userType,
      tenantId,
      type: "access",
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m" }
  );

  const refreshToken = jwt.sign(
    {
      userId,
      userType,
      tenantId,
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d" }
  );

  return { accessToken, refreshToken };
};


// Utility function to detect device type
export const detectDeviceType = (userAgent) => {
  if (!userAgent) return "unknown";

  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
};

// Utility function to extract browser and OS info
export const extractDeviceInfo = (userAgent) => {
  if (!userAgent) return { browser: "unknown", os: "unknown" };

  let browser = "unknown";
  let os = "unknown";

  // Browser detection
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";
  else if (userAgent.includes("Opera")) browser = "Opera";

  // OS detection
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS")) os = "iOS";

  return { browser, os };
};