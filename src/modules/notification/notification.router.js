import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
  getUnreadCount,
  deleteNotification,
  
} from "./notification.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { deleteNotificationValidation, getNotificationsValidation, markNotificationAsReadValidation } from "./notification.validation.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/v1/notifications - Get user's notifications with pagination and filtering
router.get("/", validate(getNotificationsValidation), getNotifications);

// GET /api/v1/notifications/unread-count - Get unread notifications count
router.get("/unread-count",  getUnreadCount);

// PATCH /api/v1/notifications/:id/read - Mark a specific notification as read
router.patch("/:id/read", validate(markNotificationAsReadValidation), markNotificationAsRead);

// DELETE /api/v1/notifications/:id - Delete a specific notification
router.delete("/:id", validate(deleteNotificationValidation), deleteNotification);


export default router;
