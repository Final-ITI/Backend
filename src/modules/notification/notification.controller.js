import Notification from "../../../DB/models/notification.js";
import { asyncHandler } from "../../utils/apiError.js";
import {
  success,
  error,
  paginated,
  notFound,
} from "../../utils/apiResponse.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, isRead, type } = req.query;
  const limit = 10;
  // Build filter object
  const filter = { recipient: userId };

  if (isRead !== undefined) {
    filter.isRead = isRead === "true";
  }

  if (type) {
    filter.type = type;
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const totalItems = await Notification.countDocuments(filter);
  const totalPages = Math.ceil(totalItems / parseInt(limit));

  // Get notifications with pagination
  const notifications = await Notification.find(filter)
    .populate("sender", "firstName lastName profileImage")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Transform notifications for response
  const transformedNotifications = notifications.map((notification) => ({
    id: notification._id,
    type: notification.type,
    message: notification.message,
    link: notification.link,
    isRead: notification.isRead,
    sender: notification.sender
      ? {
        id: notification.sender._id,
        name: `${notification.sender.firstName} ${notification.sender.lastName}`,
        profileImage: notification.sender.profileImage,
      }
      : null,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  }));

  // Pagination info
  const paginationInfo = {
    currentPage: parseInt(page),
    totalPages,
    totalItems,
    itemsPerPage: parseInt(limit),
    hasNext: parseInt(page) < totalPages,
    hasPrev: parseInt(page) > 1,
  };

  return paginated(res, transformedNotifications, paginationInfo);
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const notificationId = req.params.id;

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return notFound(res, "لم يتم العثور على الإشعار أو لا يخصك");
  }

  return success(res, { isRead: true }, "تم وضع علامة على الإشعار كمقروء");
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  return success(
    res,
    { unreadCount: count },
    "تم جلب عدد الإشعارات غير المقروءة بنجاح"
  );
});

/**
 * Delete a notification
 * @route DELETE /api/v1/notifications/:id
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const notificationId = req.params.id;

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });

  if (!notification) {
    return notFound(res, "لم يتم العثور على الإشعار أو لا يخصك");
  }

  return success(res, null, "تم حذف الإشعار بنجاح");
});
