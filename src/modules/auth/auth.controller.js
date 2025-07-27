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
import Teacher from "../../../DB/models/teacher.js";
import Student from "../../../DB/models/student.js";

export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, gender, role, country } =
    req.body;
  // Check Email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError("البريد الإلكتروني مستخدم من قبل", 400);
  }

  // Generate activation code
  const activationCodeEmail = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    gender,
    country,
    userType: role,
    activationCodeEmail,
  });

  // Create associated model
  if (role === "student") {
    console.log("Creating student profile for user:", user._id);
    const student = await Student.create({
      userId: user._id,
    });
    console.log("Student profile created:", student);
  } else if (role === "teacher") {
    await Teacher.create({ userId: user._id });
  }

  // Send Mail
  const isSent = await EmailService.sendActivationEmail({
    email,
    activationCode: activationCodeEmail,
  });
  if (!isSent) throw new ApiError("فشل في إرسال بريد التفعيل", 500);

  // Send response
  created(
    res,
    null,
    `${
      role === "student"
        ? "تم تسجيل الطالب بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب."
        : "تم تسجيل المعلم بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب."
    }`
  );
});

export const activateEmail = asyncHandler(async (req, res) => {
  const { activationCodeEmail } = req.params;

  // Verify activation code
  let decoded;
  try {
    decoded = jwt.verify(activationCodeEmail, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError("رمز التفعيل غير صالح أو منتهي الصلاحية", 400);
  }

  // Find user
  const user = await User.findOneAndUpdate(
    { activationCodeEmail },
    { isEmailVerified: true, $unset: { activationCodeEmail: 1 } },
    { new: true }
  );
  if (!user)
    throw new ApiError("المستخدم غير موجود أو تم تفعيل الحساب مسبقاً", 404);

  // Send response
  success(
    res,
    null,
    "تم تفعيل البريد الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول."
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email and include password for comparison
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new ApiError("البريد الإلكتروني أو كلمة المرور غير صحيحة", 401);
  }
  // Check if email is verified
  if (!user.isEmailVerified) {
    throw new ApiError("يرجى تفعيل البريد الإلكتروني قبل تسجيل الدخول", 401);
  }

  // Check if account is locked
  if (user.isLocked) {
    const lockTime = new Date(user.lockUntil);
    const now = new Date();
    if (lockTime > now) {
      const remainingMinutes = Math.ceil((lockTime - now) / (1000 * 60));
      throw new ApiError(
        `تم قفل الحساب مؤقتاً. حاول مرة أخرى بعد ${remainingMinutes} دقيقة.`,
        423
      );
    }
  }

  // Verify password
  const isPasswordCorrect = await user.correctPassword(password, user.password);
  if (!isPasswordCorrect) {
    await user.incLoginAttempts();
    const updatedUser = await User.findById(user._id);
    if (updatedUser.isLocked) {
      throw new ApiError(
        "عدد محاولات تسجيل الدخول تجاوز الحد المسموح. تم قفل الحساب لمدة ساعتين.",
        423
      );
    }
    throw new ApiError("البريد الإلكتروني أو كلمة المرور غير صحيحة", 401);
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
    token: refreshToken,
    expiresAt: refreshTokenExpires,
    deviceInfo: { userAgent, ipAddress },
    tenantId: user.tenantId,
  });

  // --- Send Refresh Token as a secure cookie ---
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES) * 24 * 60 * 60 * 1000,
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

  // If the logged-in user is a teacher, add isVerified status
  if (user.userType === "teacher") {
    const teacher = await Teacher.findOne({ userId: user._id }).select(
      "isVerified verificationStatus rejectionReason"
    );
    if (teacher) {
      userData.verificationStatus = teacher.verificationStatus;
      userData.isVerified = teacher.isVerified;
      // Also send the rejection reason if the status is 'rejected'
      if (teacher.verificationStatus === "rejected") {
        userData.rejectionReason = teacher.rejectionReason;
      }
    }
  }

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
    "تم تسجيل الدخول بنجاح"
  );
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await Token.revokeToken(refreshToken, "user_logout", req.user?._id).catch(
      () => {}
    );
  }

  res.cookie("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
  });

  success(res, null, "تم تسجيل الخروج بنجاح");
});

export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError("رمز التحديث غير موجود.", 401);
  }

  const tokenDoc = await Token.findValidToken(incomingRefreshToken, "refresh");

  if (!tokenDoc) {
    throw new ApiError(
      "رمز التحديث غير صالح أو منتهي الصلاحية. يرجى تسجيل الدخول مرة أخرى.",
      403
    );
  }

  const { user } = tokenDoc;

  if (!user) {
    throw new ApiError("المستخدم غير موجود.", 401);
  }

  await tokenDoc.revoke("token_refresh");

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
    generateTokens(user._id, user.userType, user.tenantId);

  const newRefreshTokenExpires = new Date(
    Date.now() +
      parseInt(process.env.REFRESH_TOKEN_EXPIRES) * 24 * 60 * 60 * 1000
  );
  await Token.create({
    user: user._id,
    tokenType: "refresh",
    token: newRefreshToken,
    expiresAt: newRefreshTokenExpires,
    deviceInfo: tokenDoc.deviceInfo,
    tenantId: user.tenantId,
    refreshTokenChain: { previousToken: tokenDoc._id },
  });

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES) * 24 * 60 * 60 * 1000,
  });

  success(res, { accessToken: newAccessToken }, "تم تحديث الرموز بنجاح");
});

export const logoutAllDevices = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Token.revokeAllUserTokens(userId, "user_logout_all", userId);

  success(res, null, "تم تسجيل الخروج من جميع الأجهزة بنجاح");
});

export const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return notFound(res, "المستخدم غير موجود");

  try {
    await AuthMailService.sendResetCodeEmail(user);
    return success(
      res,
      null,
      "تم إرسال رمز إعادة التعيين إلى بريدك الإلكتروني."
    );
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetIsVerified = false;
    await user.save();

    return error(res, "فشل في إرسال رمز إعادة التعيين", 500, {
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

  if (!user)
    return error(res, "رمز إعادة التعيين غير صالح أو منتهي الصلاحية", 400);

  user.passwordResetIsVerified = true;
  await user.save();

  return success(res, null, "تم التحقق من رمز إعادة التعيين بنجاح.");
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetCode, newPassword } = req.body;
  const hashed = createHash("sha256").update(resetCode).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetIsVerified: true,
  });

  if (!user) {
    return error(res, "رمز إعادة التعيين غير صالح أو منتهي الصلاحية", 400);
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetIsVerified = false;
  user.passwordChangedAt = Date.now();
  await user.save();

  const { accessToken, refreshToken } = generateTokens(
    user._id,
    user.userType,
    user.tenantId
  );

  const accessTokenExpires = new Date(
    Date.now() + parseInt(process.env.ACCESS_TOKEN_EXPIRES || "15") * 60 * 1000
  );
  const refreshTokenExpires = new Date(
    Date.now() +
      parseInt(process.env.REFRESH_TOKEN_EXPIRES || "7") * 24 * 60 * 60 * 1000
  );

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

  if (accessTokenDoc && refreshTokenDoc) {
    refreshTokenDoc.refreshTokenChain.previousToken = null;
    refreshTokenDoc.refreshTokenChain.nextToken = null;
    await refreshTokenDoc.save();
  }

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
    "تم إعادة تعيين كلمة المرور بنجاح."
  );
});
