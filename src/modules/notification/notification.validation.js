import { query, param } from "express-validator";

// Validation for query parameters in GET /notifications
export const getNotificationsValidation = [
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("يجب أن تكون الصفحة رقمًا صحيحًا أكبر من 0")
        .toInt(),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("يجب أن يكون الحد رقمًا صحيحًا بين 1 و 100")
        .toInt(),
    query("isRead")
        .optional()
        .isBoolean()
        .withMessage("يجب أن تكون isRead قيمة منطقية")
        .toBoolean(),
    query("type")
        .optional()
        .isIn(["chat_message", "halaka_invitation", "payment_success", "system_alert"])
        .withMessage("نوع الإشعار غير صالح"),
];

// Validation for marking notification as read
export const markNotificationAsReadValidation = [
    param("id")
        .notEmpty()
        .withMessage("المعرف مطلوب")
        .isMongoId()
        .withMessage("معرف MongoDB غير صالح"),
];

// Validation for deleting notification
export const deleteNotificationValidation = [
    param("id")
        .notEmpty()
        .withMessage("المعرف مطلوب")
        .isMongoId()
        .withMessage("معرف MongoDB غير صالح"),
];
