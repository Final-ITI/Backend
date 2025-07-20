# Notification API Documentation

## Overview

The Notification API provides endpoints for managing user notifications including fetching, marking as read, and deleting notifications.

## Base URL

```
/api/v1/notifications
```

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get Notifications

**GET** `/api/v1/notifications`

Retrieve paginated notifications for the authenticated user with optional filtering.

#### Query Parameters

| Parameter | Type    | Required | Default | Description                         |
| --------- | ------- | -------- | ------- | ----------------------------------- |
| `page`    | number  | No       | 1       | Page number for pagination          |
| `limit`   | number  | No       | 10      | Number of items per page (max: 100) |
| `isRead`  | boolean | No       | -       | Filter by read status (true/false)  |
| `type`    | string  | No       | -       | Filter by notification type         |

#### Notification Types

- `chat_message` - Chat message notifications
- `halaka_invitation` - Halaka invitation notifications
- `payment_success` - Payment success notifications
- `system_alert` - System alert notifications

#### Example Request

```bash
GET /api/v1/notifications?page=1&limit=10&isRead=false&type=halaka_invitation
```

#### Example Response

```json
{
  "status": "success",
  "data": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "type": "halaka_invitation",
      "message": "المعلم أحمد يدعوك للانضمام إلى حلقة \"تلاوة القرآن\"",
      "link": "/enrollments/invitations/64f8a1b2c3d4e5f6a7b8c9d1",
      "isRead": false,
      "sender": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "name": "أحمد محمد",
        "profileImage": "https://example.com/profile.jpg"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. Get Unread Count

**GET** `/api/v1/notifications/unread-count`

Get the count of unread notifications for the authenticated user.

#### Example Request

```bash
GET /api/v1/notifications/unread-count
```

#### Example Response

```json
{
  "status": "success",
  "data": {
    "unreadCount": 5
  },
  "message": "Unread count fetched successfully"
}
```

### 3. Mark Notification as Read

**PATCH** `/api/v1/notifications/:id/read`

Mark a specific notification as read.

#### Path Parameters

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `id`      | string | Yes      | Notification ID |

#### Example Request

```bash
PATCH /api/v1/notifications/64f8a1b2c3d4e5f6a7b8c9d0/read
```

#### Example Response

```json
{
  "status": "success",
  "data": {
    "isRead": true
  },
  "message": "Notification marked as read"
}
```



### 4. Delete Notification

**DELETE** `/api/v1/notifications/:id`

Delete a specific notification.

#### Path Parameters

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `id`      | string | Yes      | Notification ID |

#### Example Request

```bash
DELETE /api/v1/notifications/64f8a1b2c3d4e5f6a7b8c9d0
```

#### Example Response

```json
{
  "status": "success",
  "data": null,
  "message": "Notification deleted successfully"
}
```


## Error Responses

### 400 Bad Request

```json
{
  "status": "error",
  "message": "Invalid query parameters",
  "errors": ["page must be a positive integer"]
}
```

### 401 Unauthorized

```json
{
  "status": "error",
  "message": "Authentication required"
}
```

### 404 Not Found

```json
{
  "status": "error",
  "message": "Notification not found or not yours"
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Failed to fetch notifications"
}
```

## Notification Object Structure

```json
{
  "id": "string",
  "type": "string",
  "message": "string",
  "link": "string",
  "isRead": "boolean",
  "sender": {
    "id": "string",
    "name": "string",
    "profileImage": "string"
  },
  "createdAt": "date",
  "updatedAt": "date"
}
```

## Real-time Notifications

Notifications are also sent in real-time via WebSocket when they are created. The frontend should listen for the `new_notification` event:

```javascript
socket.on("new_notification", (notification) => {
  // Handle new notification
  console.log("New notification:", notification);
});
```

## Best Practices

1. **Pagination**: Always use pagination when fetching notifications to avoid performance issues
2. **Filtering**: Use the `isRead` and `type` filters to show relevant notifications
3. **Real-time Updates**: Implement WebSocket listeners for real-time notification updates
4. **Cleanup**: Regularly delete old read notifications to maintain performance
5. **Error Handling**: Always handle API errors gracefully in your frontend application
