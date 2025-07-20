import { query, param } from "express-validator";

// Validation for query parameters in GET /notifications
export const getNotificationsValidation = [
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be an integer greater than 0")
        .toInt(),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be an integer between 1 and 100")
        .toInt(),
    query("isRead")
        .optional()
        .isBoolean()
        .withMessage("isRead must be a boolean")
        .toBoolean(),
    query("type")
        .optional()
        .isIn(["chat_message", "halaka_invitation", "payment_success", "system_alert"])
        .withMessage("Invalid notification type"),
];

// Validation for marking notification as read
export const markNotificationAsReadValidation = [
    param("id")
        .notEmpty()
        .withMessage("ID is required")
        .isMongoId()
        .withMessage("Invalid MongoDB ObjectId"),
];

// Validation for deleting notification
export const deleteNotificationValidation = [
    param("id")
        .notEmpty()
        .withMessage("ID is required")
        .isMongoId()
        .withMessage("Invalid MongoDB ObjectId"),
];
