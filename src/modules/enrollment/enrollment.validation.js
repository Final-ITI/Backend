import { body, param } from "express-validator";
import { isValidObjectId } from "../../middlewares/validation.middleware.js";

export const enrollInHalakaValidation = [
  body("id")
    .notEmpty()
    .withMessage("معرف الحلقة مطلوب.")
    .isString()
    .withMessage("يجب أن يكون معرف الحلقة سلسلة نصية.")
    .custom((value) => {
      return isValidObjectId(value);
    })
    .withMessage("صيغة معرف الحلقة غير صالحة.")
    .trim()
    .escape(),
];

export const actOnInvitationValidation = [
  param("id")
    .notEmpty()
    .withMessage("معرف التسجيل مطلوب.")
    .custom((value) => isValidObjectId(value))
    .withMessage("صيغة معرف التسجيل غير صالحة."),
  body("action")
    .notEmpty()
    .withMessage("الإجراء مطلوب.")
    .isIn(["accept", "reject"])
    .withMessage("يجب أن يكون الإجراء إما 'قبول' أو 'رفض'."),
];
