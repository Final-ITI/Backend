import { sendEmail } from "../../utils/mail/sendMail.js";
import { validationError, success, error } from "../../utils/apiResponse.js";

export const sendContactForm = async (req, res) => {
    const { fullname, email, subject, message } = req.body;
    if (!fullname || !email || !subject || !message) {
        return validationError(res, [
            "الاسم الكامل والبريد الإلكتروني والموضوع والرسالة كلها مطلوبة."
        ]);
    }
    try {
        const sent = await sendEmail({
            to: "abdalla862002@gmail.com",
            subject: `[Contact Form] ${subject}`,
            message: `From: ${fullname} <${email}>\n\n${message}`,
            html: `<p><strong>From:</strong> ${fullname} (${email})</p><p><strong>Subject:</strong> ${subject}</p><p>${message}</p>`
        });
        if (!sent) return error(res, "فشل إرسال الرسالة", 500);
        return success(res, null, "تم إرسال الرسالة بنجاح");
    } catch (err) {
        return error(res, "فشل إرسال الرسالة", 500, err);
    }
}; 