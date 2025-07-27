import { createHash } from "crypto";

import {
  generateActivationEmail,
  resetPasswordTemp,
  generateHalakaInvitationEmail,
  generateVerificationResultEmail,
} from "../utils/mail/generateHTML.js";
import { sendEmail } from "../utils/mail/sendMail.js";

export const EmailService = {
  async sendActivationEmail({ email, activationCode }) {
    // const link = `http://localhost:4000/api/v1/auth/activate/${activationCode}`;
    const link = `${process.env.FE_URL}/confirm_email/${activationCode}`;
    const html = generateActivationEmail(link);

    return await sendEmail({
      to: email,
      subject: "Activate Account",
      html,
    });
  },

  async sendVerificationResultEmail(email, subject, body) {
    const html = generateVerificationResultEmail(subject, body);

    return await sendEmail({
      to: email,
      subject: subject,
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

export const HalakaMailService = {
  async sendHalakaInvitationEmail(
    studentEmail,
    studentName,
    teacherName,
    halakaData,
    enrollmentLink
  ) {
    const html = generateHalakaInvitationEmail(
      studentName,
      teacherName,
      halakaData.title,
      halakaData.description,
      halakaData.schedule,
      halakaData.price,
      enrollmentLink
    );

    await sendEmail({
      to: studentEmail,
      subject: `دعوة لحلقة خاصة: ${halakaData.title}`,
      html,
    });

    return true;
  },
};
