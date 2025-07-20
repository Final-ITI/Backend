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
    // 1. Save the notification to the database (for persistence)
    const notification = await Notification.create(notificationData);

    // 2. Attempt to send a real-time notification via Socket.IO
    const receiverSocketId = userSocketMap[notification.recipient];
    if (receiverSocketId && io) {
      // We use a general event name 'new_notification'
      io.to(receiverSocketId).emit("new_notification", notification);
    }
    
    return notification;

  } catch (error) {
    console.error("Error sending notification:", error);
    // We don't throw an error here to avoid stopping the main process
  }
};