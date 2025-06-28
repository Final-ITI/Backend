
import { generateActivationEmail } from "../utils/mail/generateHTML.js";
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
