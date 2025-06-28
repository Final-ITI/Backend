import nodemailer from "nodemailer";
/**
 * @async
 * @example
 * await sendEmail({
 *   to: "ali@example.com",
 *   subject: "Hello",
 *   message: "This is a test email",
 *   html: "<h1>This is HTML content</h1>"
 * });
 */
export const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "Motqan", // Sender name
    to: options.to,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message,
  };

  const emailInfo = await transporter.sendMail(mailOptions);
  return emailInfo.accepted.length < 1 ? false : true;
};


