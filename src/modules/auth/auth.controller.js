import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { EmailService, AuthMailService } from "../../services/email.service.js";
import ApiError, { asyncHandler } from "../../utils/apiError.js";
import User from "../../../DB/models/user.js";
import Token from "../../../DB/models/token.js";
import { created, success, error, notFound } from "../../utils/apiResponse.js";
import {
  detectDeviceType,
  extractDeviceInfo,
  generateTokens,
} from "../../utils/token.js";

export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, gender, role, country } =
    req.body;
  // Check Email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError("Email already exists", 400);
  }

  // Generate activation code
  const activationCodeEmail = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  // Create user
  await User.create({
    firstName,
    lastName,
    email,
    password,
    gender,
    country,
    userType: role,
    activationCodeEmail,
  });

  // Send Mail
  const isSent = await EmailService.sendActivationEmail({
    email,
    activationCode: activationCodeEmail,
  });
  if (!isSent) throw new ApiError("Failed to send activation email", 500);

  // Send response
  created(
    res,
    null,
    `${role} registered successfully. Please check your email to activate your account.`
  );
});

export const activateEmail = asyncHandler(async (req, res) => {
  const { activationCodeEmail } = req.params;

  // Verify activation code
  let decoded;
  try {
    decoded = jwt.verify(activationCodeEmail, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError("Invalid or expired activation code", 400);
  }

  // Find user
  const user = await User.findOneAndUpdate(
    { activationCodeEmail },
    { isEmailVerified: true, $unset: { activationCodeEmail: 1 } },
    { new: true }
  );
  if (!user) throw new ApiError("User not found or already activated", 404);

  // Send response
  success(res, null, "Email activated successfully. You can now log in.");
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email and include password for comparison
  const user = await User.findOne({ email }).select("+password");
  // --- (Same robust checks as before: user exists, password correct, not locked, etc.) ---
  if (!user || !(await user.correctPassword(password, user.password))) {
    // Handle failed login attempts and locking (your existing logic is great here)
    throw new ApiError("Invalid email or password", 401);
  }



  // Check if email is verified
  if (!user.isEmailVerified) {
    throw new ApiError("Please verify your email before logging in", 401);
  }

  // Check if account is locked
  if (user.isLocked) {
    const lockTime = new Date(user.lockUntil);
    const now = new Date();
    if (lockTime > now) {
      const remainingMinutes = Math.ceil((lockTime - now) / (1000 * 60));
      throw new ApiError(
        `Account is temporarily locked. Try again in ${remainingMinutes} minutes.`,
        423
      );
    }
  }

  // Verify password
  const isPasswordCorrect = await user.correctPassword(password, user.password);
  if (!isPasswordCorrect) {
    // Increment login attempts
    await user.incLoginAttempts();

    // Check if account should be locked after failed attempt
    const updatedUser = await User.findById(user._id);
    if (updatedUser.isLocked) {
      throw new ApiError(
        "Too many failed login attempts. Account locked for 2 hours.",
        423
      );
    }

    throw new ApiError("Invalid email or password", 401);
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await User.findByIdAndUpdate(user._id, {
      $set: { loginAttempts: 0 },
      $unset: { lockUntil: 1 },
    });
  }

  // Update last login
  await User.findByIdAndUpdate(user._id, {
    lastLogin: new Date(),
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(
    user._id,
    user.userType,
    user.tenantId
  );

  // Prepare device information
  const userAgent = req.headers["user-agent"];
  const ipAddress = req.ip || req.connection.remoteAddress;
  const deviceType = detectDeviceType(userAgent);
  const { browser, os } = extractDeviceInfo(userAgent);

  const deviceInfo = {
    userAgent,
    ipAddress,
    deviceType,
    browser,
    os,
  };

  // Calculate token expiration times

  const refreshTokenExpires = new Date(
    Date.now() +
      parseInt(process.env.REFRESH_TOKEN_EXPIRES || "7") * 24 * 60 * 60 * 1000
  );

  // Store tokens in database
  await Token.create({
    user: user._id,
    tokenType: "refresh",
    token: refreshToken, // The raw token is hashed by the pre-save hook
    expiresAt: refreshTokenExpires,
    deviceInfo: { userAgent, ipAddress /* ...other info */ },
    tenantId: user.tenantId,
  });

  // --- Send Refresh Token as a secure cookie ---
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // Prevents client-side JS from accessing the cookie
    secure: process.env.NODE_ENV === "production", // Only send over HTTPS
    sameSite: "strict", // Mitigates CSRF attacks
    maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES) * 24 * 60 * 60 * 1000, // 7 days
  });

  // Prepare user data for response (exclude sensitive information)
  const userData = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    userType: user.userType,
    isEmailVerified: user.isEmailVerified,
    profilePicture: user.profilePicture,
    tenantId: user.tenantId,
    lastLogin: user.lastLogin,
  };

  // Send response
  success(
    res,
    {
      user: userData,
      tokens: {
        accessToken,
      },
      deviceInfo: {
        deviceType,
        browser,
        os,
        ipAddress,
      },
    },
    "Login successful"
  );
});

export const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
        // Revoke the token in the database, ignoring if it fails (e.g., already invalid)
        await Token.revokeToken(refreshToken, "user_logout", req.user?._id).catch(() => {});
    }

    // Clear the cookie on the client side
    res.cookie('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0) // Set expiry to a past date to delete it
    });

    success(res, null, "Logged out successfully");
});

export const refreshToken = asyncHandler(async (req, res) => {
  // 1. Get refresh token from the cookie
  const incomingRefreshToken = req.cookies.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError("Refresh token not found.", 401);
  }

  // 2. Find the valid token in the DB
  const tokenDoc = await Token.findValidToken(incomingRefreshToken, "refresh");
  if (!tokenDoc) {
    // This could mean the token was stolen and used. In a high-security scenario,
    // you might want to invalidate all tokens for this user.
    throw new ApiError(
      "Invalid or expired refresh token. Please log in again.",
      403
    );
  }

  const { user } = tokenDoc; // The user is populated from findValidToken

  // 3. Check user status
  if (!user) {
    throw new ApiError("User not found.", 401);
  }

  // --- Implement Refresh Token Rotation ---

  // 4. Revoke the old refresh token
  await tokenDoc.revoke("token_refresh");

  // 5. Generate new pair of tokens
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
    generateTokens(user._id, user.userType, user.tenantId);

  // 6. Store the new refresh token in the DB
  const newRefreshTokenExpires = new Date(
    Date.now() +
      parseInt(process.env.REFRESH_TOKEN_EXPIRES) * 24 * 60 * 60 * 1000
  );
  await Token.create({
    user: user._id,
    tokenType: "refresh",
    token: newRefreshToken,
    expiresAt: newRefreshTokenExpires,
    deviceInfo: tokenDoc.deviceInfo, // Reuse device info
    tenantId: user.tenantId,
    refreshTokenChain: { previousToken: tokenDoc._id },
  });

  // 7. Send the new refresh token in a new cookie
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES) * 24 * 60 * 60 * 1000,
  });

  // 8. Send the new access token in the response
  success(
    res,
    { accessToken: newAccessToken },
    "Tokens refreshed successfully"
  );
});

export const logoutAllDevices = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Revoke all user tokens
  await Token.revokeAllUserTokens(userId, "user_logout_all", userId);

  success(res, null, "Logged out from all devices successfully");
});

export const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return notFound(res, "User not found");

  try {
    await AuthMailService.sendResetCodeEmail(user);
    return success(res, null, "Reset code sent to your email.");
  } catch (err) {
    // Clean up on failure
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetIsVerified = false;
    await user.save();

    return error(res, "Failed to send reset code", 500, {
      message: err.message,
      stack: err.stack,
    });
  }
});

export const verifyResetCode = asyncHandler(async (req, res) => {
  const { resetCode } = req.body;
  const hashed = createHash("sha256").update(resetCode).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return error(res, "Invalid or expired reset code", 400);

  user.passwordResetIsVerified = true;
  await user.save();

  return success(res, null, "Reset code verified successfully.");
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetCode, newPassword } = req.body;
  const hashed = createHash("sha256").update(resetCode).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetIsVerified: true,
  });

  if (!user) {
    return error(res, "Invalid or expired reset code", 400);
  }

  // Update user password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetIsVerified = false;
  user.passwordChangedAt = Date.now();
  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(
    user._id,
    user.userType,
    user.tenantId
  );

  // Set token expiration times
  const accessTokenExpires = new Date(
    Date.now() + parseInt(process.env.ACCESS_TOKEN_EXPIRES || "15") * 60 * 1000
  );
  const refreshTokenExpires = new Date(
    Date.now() +
      parseInt(process.env.REFRESH_TOKEN_EXPIRES || "7") * 24 * 60 * 60 * 1000
  );

  // Get device info
  const userAgent = req.headers["user-agent"];
  const ipAddress = req.ip || req.connection.remoteAddress;
  const deviceType = detectDeviceType(userAgent);
  const { browser, os } = extractDeviceInfo(userAgent);

  const deviceInfo = {
    userAgent,
    ipAddress,
    deviceType,
    browser,
    os,
  };

  // Store tokens in database
  const [accessTokenDoc, refreshTokenDoc] = await Promise.all([
    Token.createToken({
      user: user._id,
      tokenType: "access",
      token: accessToken,
      expiresAt: accessTokenExpires,
      deviceInfo,
      tenantId: user.tenantId,
    }),
    Token.createToken({
      user: user._id,
      tokenType: "refresh",
      token: refreshToken,
      expiresAt: refreshTokenExpires,
      deviceInfo,
      tenantId: user.tenantId,
    }),
  ]);

  // Link refresh token chain
  if (accessTokenDoc && refreshTokenDoc) {
    refreshTokenDoc.refreshTokenChain.previousToken = null;
    refreshTokenDoc.refreshTokenChain.nextToken = null;
    await refreshTokenDoc.save();
  }

  // Prepare user data
  const userData = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    userType: user.userType,
    isEmailVerified: user.isEmailVerified,
    profilePicture: user.profilePicture,
    tenantId: user.tenantId,
    lastLogin: user.lastLogin,
  };

  // Send success response
  return success(
    res,
    {
      user: userData,
      tokens: {
        accessToken,
        refreshToken,
        accessTokenExpires,
        refreshTokenExpires,
      },
      deviceInfo: {
        deviceType,
        browser,
        os,
        ipAddress,
      },
    },
    "Password reset successfully."
  );
});
