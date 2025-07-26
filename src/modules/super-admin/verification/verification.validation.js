import { body, param } from "express-validator";
import { query } from "express-validator";
import { isValidObjectId } from "../../../middlewares/validation.middleware.js";

export const getVerificationRequestsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("يجب أن تكون الصفحة رقمًا صحيحًا موجبًا"),

  query("verificationStatus")
    .optional()
    .isIn(["pending", "approved", "rejected"])
    .withMessage("حالة التحقق غير صالحة"),

  query("q")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("يجب أن يتراوح طول استعلام البحث بين 2 و 100 حرف")
    .trim(),
];

const createIdValidator = (paramName, fieldName) => [
  param(paramName)
    .exists()
    .withMessage(`معرف ${fieldName} مطلوب`)
    .custom(isValidObjectId)
    .withMessage(`صيغة معرف ${fieldName} غير صالحة`),
];

export const validateTeacherId = createIdValidator("teacherId", "المعلم");
export const validateDocumentId = createIdValidator("documentId", "المستند");

export const updateTeacherVerificationStatusValidation = [
  param("teacherId")
    .exists()
    .withMessage("معرف المعلم مطلوب")
    .custom(isValidObjectId)
    .withMessage("صيغة معرف المعلم غير صالحة"),

  body("action")
    .exists()
    .withMessage("الإجراء مطلوب")
    .isIn(["approve", "reject"])
    .withMessage("يجب أن يكون الإجراء إما 'موافقة' أو 'رفض'"),
]