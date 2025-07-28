// src/services/notification.service.js
import Notification from "../../DB/models/notification.js";
import { io, userSocketMap } from "../socket/socket.js"; // استيراد io و userSocketMap من ملف السوكيت

/**
 * A centralized function to create and send notifications.
 * @param {object} notificationData - The data for the notification.
 * @param {string} notificationData.recipient - The ID of the user receiving the notification.
 * @param {string} notificationData.sender - The ID of the user sending the notification.
 * @param {string} notificationData.type - The type of notification.
 * @param {string} notificationData.message - The notification message.
 * @param {string} notificationData.link - The navigation link.
 */
export const sendNotification = async (notificationData) => {
  try {
    console.log("##############################");
    // 1. Save the notification to the database
    const notification = await Notification.create(notificationData);
    console.log("Notification saved to DB:", notification);
    // 2. Populate sender details before emitting
    const populatedNotification = await Notification.findById(
      notification._id
    ).populate("sender", "firstName lastName profileImage");
    console.log("Populated notification:", populatedNotification);
    // 3. Attempt to send a real-time notification
    const recipientIdString = populatedNotification.recipient.toString();
    const receiverSocketId = userSocketMap[recipientIdString];
    console.log(
      `Attempting to send notification to user ${recipientIdString} with socket ID ${receiverSocketId}`
    );
    if (receiverSocketId && io) {
      console.log(
        `Sending notification to user ${recipientIdString} via socket ${receiverSocketId}`
      );

      io.to(receiverSocketId).emit("new_notification", populatedNotification);
    } else {
      console.log(
        `User ${recipientIdString} is not online. Notification saved to DB.`
      );
    }

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
