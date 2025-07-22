# Notification Flow Documentation

## Overview

This document explains the complete flow of notifications in the Motqan application, from creation to client-side handling, including all events and their names.

## Notification Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Event Trigger │───▶│  sendNotification │───▶│   Database      │───▶│   WebSocket     │
│   (e.g., halaka │    │   Service Call   │    │   Storage       │    │   Broadcast     │
│   creation)     │    │                  │    │                 │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘
                                                         │                       │
                                                         ▼                       ▼
                                                ┌─────────────────┐    ┌─────────────────┐
                                                │   Email Service │    │   Client Side   │
                                                │   (Optional)    │    │   Event Listener│
                                                │                 │    │                 │
                                                └─────────────────┘    └─────────────────┘
```

## 1. Event Triggers

### Halaka Invitation Flow

**Location:** `DB/models/halaka.js` - Post-save middleware

```javascript
// Triggered when teacher creates private halaka
if (doc.halqaType === "private" && doc.student) {
  await handlePrivateHalakaCreation(doc);
}
```

**Flow:**

1. Teacher creates private halaka
2. Post-save middleware triggers
3. Enrollment created automatically
4. Notification sent to student
5. Email invitation sent

### Chat Message Flow

**Location:** Chat module (when implemented)

```javascript
// Triggered when user sends message in chat group
await sendNotification({
  recipient: recipientId,
  sender: senderId,
  type: "chat_message",
  message: `${senderName}: ${messagePreview}`,
  link: `/chat/${chatGroupId}`,
});
```

### Payment Success Flow

**Location:** Payment/webhook modules

```javascript
// Triggered when payment is processed successfully
await sendNotification({
  recipient: userId,
  type: "payment_success",
  message: "تم دفع الرسوم بنجاح. يمكنك الآن الانضمام للحلقة.",
  link: `/enrollments/${enrollmentId}`,
});
```

## 2. Notification Service Flow

**Location:** `src/services/notification.service.js`

```javascript
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
```

**Steps:**

1. **Database Storage** - Save notification to MongoDB
2. **WebSocket Check** - Check if recipient is online
3. **Real-time Broadcast** - Send via Socket.IO if user is connected
4. **Error Handling** - Graceful error handling without breaking main flow

## 3. WebSocket Events

### Server-Side Events (Sent by Backend)

#### `new_notification`

**Event Name:** `new_notification`
**Triggered:** When a new notification is created
**Data Structure:**

```javascript
{
  _id: "64f8a1b2c3d4e5f6a7b8c9d0",
  recipient: "64f8a1b2c3d4e5f6a7b8c9d1",
  sender: "64f8a1b2c3d4e5f6a7b8c9d2",
  type: "halaka_invitation",
  message: "المعلم أحمد يدعوك للانضمام إلى حلقة \"تلاوة القرآن\"",
  link: "/enrollments/invitations/64f8a1b2c3d4e5f6a7b8c9d3",
  isRead: false,
  createdAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-01-15T10:30:00.000Z"
}
```

**Usage:**

```javascript
// Backend - Sending notification
io.to(receiverSocketId).emit("new_notification", notification);
```

### Client-Side Events (Sent by Frontend)

#### `mark_notification_read`

**Event Name:** `mark_notification_read`
**Purpose:** Mark notification as read in real-time
**Data Structure:**

```javascript
{
  notificationId: "64f8a1b2c3d4e5f6a7b8c9d0",
  userId: "64f8a1b2c3d4e5f6a7b8c9d1"
}
```

#### `notification_clicked`

**Event Name:** `notification_clicked`
**Purpose:** Track notification engagement
**Data Structure:**

```javascript
{
  notificationId: "64f8a1b2c3d4e5f6a7b8c9d0",
  userId: "64f8a1b2c3d4e5f6a7b8c9d1",
  type: "halaka_invitation"
}
```

## 4. Client-Side Implementation

### Socket Connection Setup

```javascript
import io from "socket.io-client";

class NotificationService {
  constructor() {
    this.socket = io("http://localhost:4000", {
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for new notifications
    this.socket.on("new_notification", this.handleNewNotification.bind(this));

    // Listen for connection status
    this.socket.on("connect", this.handleConnect.bind(this));
    this.socket.on("disconnect", this.handleDisconnect.bind(this));
  }

  handleNewNotification(notification) {
    console.log("New notification received:", notification);

    // Update notification count
    this.updateNotificationCount();

    // Show toast notification
    this.showToastNotification(notification);

    // Update notification list if open
    this.updateNotificationList();
  }

  handleConnect() {
    console.log("Connected to notification service");
  }

  handleDisconnect() {
    console.log("Disconnected from notification service");
  }

  // Send events to server
  markNotificationRead(notificationId) {
    this.socket.emit("mark_notification_read", {
      notificationId,
      userId: this.getCurrentUserId(),
    });
  }

  trackNotificationClick(notificationId, type) {
    this.socket.emit("notification_clicked", {
      notificationId,
      userId: this.getCurrentUserId(),
      type,
    });
  }
}
```

### React Hook Example

```javascript
import { useEffect, useState } from "react";
import io from "socket.io-client";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io("http://localhost:4000", {
      auth: { token: localStorage.getItem("token") },
    });

    // Listen for new notifications
    newSocket.on("new_notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast
      showNotificationToast(notification);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Send socket event
      socket?.emit("mark_notification_read", { notificationId });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    socket,
  };
};
```

### Toast Notification Component

```javascript
const showNotificationToast = (notification) => {
  const toast = {
    id: notification._id,
    title: getNotificationTitle(notification.type),
    message: notification.message,
    type: "info",
    duration: 5000,
    action: {
      label: "عرض",
      onClick: () => {
        // Navigate to notification link
        window.location.href = notification.link;

        // Mark as read
        markAsRead(notification._id);

        // Track click
        socket?.emit("notification_clicked", {
          notificationId: notification._id,
          type: notification.type,
        });
      },
    },
  };

  // Show toast using your toast library
  showToast(toast);
};

const getNotificationTitle = (type) => {
  const titles = {
    halaka_invitation: "دعوة لحلقة جديدة",
    chat_message: "رسالة جديدة",
    payment_success: "تم الدفع بنجاح",
    system_alert: "تنبيه من النظام",
  };
  return titles[type] || "إشعار جديد";
};
```

## 5. Event Flow Summary

### Complete Flow Example: Halaka Invitation

1. **Trigger:** Teacher creates private halaka
2. **Backend Processing:**
   - Halaka saved to database
   - Post-save middleware triggers
   - Enrollment created
   - `sendNotification()` called
3. **Notification Creation:**
   - Notification saved to database
   - WebSocket connection checked
   - `new_notification` event sent to student
4. **Email Service:**
   - Email invitation sent via `HalakaMailService`
5. **Client-Side Handling:**
   - Student receives `new_notification` event
   - Toast notification shown
   - Notification count updated
   - Notification list refreshed
6. **User Interaction:**
   - Student clicks notification
   - `notification_clicked` event sent
   - Navigate to enrollment page
   - `mark_notification_read` event sent

## 6. Error Handling

### Server-Side Error Handling

```javascript
export const sendNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);

    const receiverSocketId = userSocketMap[notification.recipient];
    if (receiverSocketId && io) {
      io.to(receiverSocketId).emit("new_notification", notification);
    }

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    // Don't throw error to avoid breaking main flow
  }
};
```

### Client-Side Error Handling

```javascript
// Socket connection error handling
socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
  // Fallback to polling or show offline message
});

// Notification fetch error handling
const fetchNotifications = async () => {
  try {
    const response = await fetch("/api/v1/notifications");
    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching notifications:", error);
    // Show error message to user
    showErrorToast("فشل في تحميل الإشعارات");
  }
};
```

## 7. Testing Events

### Test Socket Events

```javascript
// Test new notification event
socket.emit("test_notification", {
  type: "halaka_invitation",
  message: "Test notification message",
  recipient: "test-user-id",
});

// Test mark as read event
socket.emit("mark_notification_read", {
  notificationId: "test-notification-id",
  userId: "test-user-id",
});
```

### Monitor Events in Browser Console

```javascript
// Add event listeners for debugging
socket.onAny((eventName, ...args) => {
  console.log(`Event: ${eventName}`, args);
});
```

This documentation provides a complete guide for understanding and implementing the notification flow in your Motqan application! 🎉
