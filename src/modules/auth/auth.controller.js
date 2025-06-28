import jwt from "jsonwebtoken";
import { EmailService } from "../../services/email.service.js";
import ApiError, { asyncHandler } from "../../utils/apiError.js";
import User from "../../../DB/models/user.js";
import Token from "../../../DB/models/token.js";
import { created, success } from "../../utils/apiResponse.js";
import { detectDeviceType, extractDeviceInfo, generateTokens } from "../../utils/token.js";

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
  if (!user) {
    throw new ApiError("Invalid email or password", 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError("Account is deactivated. Please contact support.", 401);
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
  const accessTokenExpires = new Date(
    Date.now() + parseInt(process.env.ACCESS_TOKEN_EXPIRES || "15") * 60 * 1000
  );
  const refreshTokenExpires = new Date(
    Date.now() +
      parseInt(process.env.REFRESH_TOKEN_EXPIRES || "7") * 24 * 60 * 60 * 1000
  );

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

  // Link refresh tokens for rotation
  if (accessTokenDoc && refreshTokenDoc) {
    refreshTokenDoc.refreshTokenChain.previousToken = null;
    refreshTokenDoc.refreshTokenChain.nextToken = null;
    await refreshTokenDoc.save();
  }

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
        refreshToken,
        accessTokenExpires: accessTokenExpires,
        refreshTokenExpires: refreshTokenExpires,
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
  const { refreshToken } = req.body;

  // Revoke the refresh token
  const revokedToken = await Token.revokeToken(
    refreshToken,
    "user_logout",
    req.user?._id
  );

  if (!revokedToken) {
    throw new ApiError("Invalid refresh token", 400);
  }

  success(res, null, "Logged out successfully");
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError("Refresh token is required", 400);
  }

  // Verify and find the refresh token
  const tokenDoc = await Token.findValidToken(refreshToken, "refresh");
  if (!tokenDoc) {
    throw new ApiError("Invalid or expired refresh token", 401);
  }

  // Verify JWT signature
  let decoded;
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
  } catch (error) {
    // Revoke the invalid token
    await Token.revokeToken(refreshToken, "security_breach");
    throw new ApiError("Invalid refresh token", 401);
  }

  // Check if user still exists and is active
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    await Token.revokeToken(refreshToken, "security_breach");
    throw new ApiError("User not found or inactive", 401);
  }

  // Check if password was changed after token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    await Token.revokeAllUserTokens(user._id, "password_change");
    throw new ApiError("Password changed. Please log in again.", 401);
  }

  // Generate new tokens
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
    generateTokens(user._id, user.userType, user.tenantId);

  // Revoke old refresh token
  await Token.revokeToken(refreshToken, "token_refresh");

  // Store new tokens
  const accessTokenExpires = new Date(
    Date.now() + parseInt(process.env.ACCESS_TOKEN_EXPIRES || "15") * 60 * 1000
  );
  const refreshTokenExpires = new Date(
    Date.now() +
      parseInt(process.env.REFRESH_TOKEN_EXPIRES || "7") * 24 * 60 * 60 * 1000
  );

  const [newAccessTokenDoc, newRefreshTokenDoc] = await Promise.all([
    Token.createToken({
      user: user._id,
      tokenType: "access",
      token: newAccessToken,
      expiresAt: accessTokenExpires,
      deviceInfo: tokenDoc.deviceInfo,
      tenantId: user.tenantId,
    }),
    Token.createToken({
      user: user._id,
      tokenType: "refresh",
      token: newRefreshToken,
      expiresAt: refreshTokenExpires,
      deviceInfo: tokenDoc.deviceInfo,
      tenantId: user.tenantId,
    }),
  ]);

  // Link refresh tokens for rotation
  if (newAccessTokenDoc && newRefreshTokenDoc) {
    newRefreshTokenDoc.refreshTokenChain.previousToken = tokenDoc._id;
    await newRefreshTokenDoc.save();
  }

  success(
    res,
    {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenExpires: accessTokenExpires,
      refreshTokenExpires: refreshTokenExpires,
    },
    "Tokens refreshed successfully"
  );
});

export const logoutAllDevices = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Revoke all user tokens
  await Token.revokeAllUserTokens(userId, "user_logout_all", userId);

  success(res, null, "Logged out from all devices successfully");
});

