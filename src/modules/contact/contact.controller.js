import { sendEmail } from "../../utils/mail/sendMail.js";
import { validationError, success, error } from "../../utils/apiResponse.js";

export const sendContactForm = async (req, res) => {
    const { fullname, email, subject, message } = req.body;
    if (!fullname || !email || !subject || !message) {
        return validationError(res, [
            "fullname, email, subject, and message are all required."
        ]);
    }
    try {
        const sent = await sendEmail({
            to: "support@example.com", 
            subject: `[Contact Form] ${subject}`,
            message: `From: ${fullname} <${email}>\n\n${message}`,
            html: `<p><strong>From:</strong> ${fullname} (${email})</p><p><strong>Subject:</strong> ${subject}</p><p>${message}</p>`
        });
        if (!sent) return error(res, "Failed to send message", 500);
        return success(res, null, "Message sent successfully");
    } catch (err) {
        return error(res, "Failed to send message", 500, err);
    }
}; 