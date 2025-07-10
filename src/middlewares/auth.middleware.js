import jwt from "jsonwebtoken";
import ApiError, { asyncHandler } from "../utils/apiError.js";
import User from "../../DB/models/user.js";
import Token from "../../DB/models/token.js";
import Teacher from "../../DB/models/teacher.js";
import Student from "../../DB/models/student.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  
  
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7); // Remove "Bearer " prefix
  }
  
  if (!token) {
    throw new ApiError("Access token is required", 401);
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is an access token
    if (decoded.type !== "access") {
      throw new ApiError("Invalid token type", 401);
    }

    // Get user information
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      throw new ApiError("User not found", 401);
    }
    
    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      throw new ApiError(
        "Password recently changed. Please log in again.",
        401
      );
    }

    // Attach user and token info to request
    req.user = user;
    req.tokenData = decoded;
    next();

  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new ApiError("Invalid token", 401);
    } else if (error.name === "TokenExpiredError") {
      throw new ApiError("Token has expired", 401);
    } else if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError("Authentication failed", 401);
    }
  }
});

export const authorize = (...roles) => {

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError("Authentication required", 401));
    }

    if (!roles.includes(req.user.userType)) {
      return next(
        new ApiError(`Access denied. Required roles: ${roles.join(", ")}`, 403)
      );
    }
    

    next();
  };
};

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
};
/**
 * Middleware to attach user profile based on role
 * This middleware checks the user's role and attaches the corresponding profile to the request object.
 * It supports roles like 'teacher' and 'student', and can be extended for other roles
 */
export const attachProfileByRole = asyncHandler(async (req, res, next) => {
  switch (req.user.userType) {
    case "teacher":
      req.teacher = await Teacher.findOne({ userId: req.user._id });
      if (!req.teacher) throw new ApiError("Teacher not found", 404);
      break;
    case "student":
      req.student = await Student.findOne({ userId: req.user._id });
      if (!req.student) throw new ApiError("Student not found", 404);
      break;
  
  }

  next();
});
