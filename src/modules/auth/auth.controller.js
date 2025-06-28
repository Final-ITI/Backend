import jwt from "jsonwebtoken";
import { EmailService } from "../../services/email.service.js";
import ApiError, { asyncHandler } from "../../utils/apiError.js";
import User from "../../../DB/models/user.js";
import { created } from "../../utils/apiResponse.js";
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
