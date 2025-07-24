import { body } from "express-validator";
import { isValidObjectId } from "../../middlewares/validation.middleware.js";

export const initiatePaymentValidation = [
    body("enrollmentId")
        .notEmpty()
        .withMessage("معرف التسجيل مطلوب.")
        .isString()
        .withMessage("معرف التسجيل يجب أن يكون نص.")
        .custom((value) => {
            return isValidObjectId(value);
        })
        .withMessage("تنسيق معرف التسجيل غير صحيح.")
        .trim()
        .escape(),
    body("paymentMethod")
        .notEmpty()
        .withMessage("طريقة الدفع مطلوبة")
        .isIn(["card", "wallet"])
        .withMessage("طريقة دفع غير صحيحة"),
    body("walletPhoneNumber")
        .if(body("paymentMethod").equals("wallet"))
        .notEmpty()
        .withMessage(
            "رقم الهاتف للمحفظة مطلوب عندما تكون طريقة الدفع محفظة"
        )
        .isMobilePhone()
        .withMessage("تنسيق رقم الهاتف غير صحيح")
        .trim()
        .escape(),
];
