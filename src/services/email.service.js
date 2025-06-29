import { createHash } from "crypto";

import {
  generateActivationEmail,
  resetPasswordTemp,
} from "../utils/mail/generateHTML.js";
import { sendEmail } from "../utils/mail/sendMail.js";

export const EmailService = {
  async sendActivationEmail({ email, activationCode }) {
    const link = `http://localhost:4000/api/v1/auth/activate/${activationCode}`;
    // const link = `${process.env.FE_URL}/auth/confirmEmail/${activationCode}`;
    const html = generateActivationEmail(link);

    return await sendEmail({
      to: email,
      subject: "Activate Account",
      html,
    });
  },
};

export const AuthMailService = {
  async sendResetCodeEmail(user) {
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = createHash("sha256").update(resetCode).digest("hex");

    // Update user with code + expiry
    user.passwordResetToken = hashedCode;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    user.passwordResetIsVerified = false;
    await user.save();

    const html = resetPasswordTemp(user.firstName, resetCode);

    await sendEmail({
      to: user.email,
      subject: "Motken Password Reset Code",
      html,
    });

    return true;
  },
};
