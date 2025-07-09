# Chat API & Real-Time Functionality Documentation

This document describes the chat functionality for backend integration and frontend usage.

---

## Authentication

All chat endpoints require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <JWT>
```

---

## REST API Endpoints

### 1. Send a Message

- **Endpoint:** `POST /api/v1/chat/send/:id`
- **Description:** Send a message to user with ID `:id`.
- **Request Body:**
  ```json
  {
    "message": "Hello!"
  }
  ```
- **Response:**
  ```json
  {
    "_id": "...",
    "senderId": "...",
    "receiverId": "...",
    "message": "Hello!",
    "read": false,
    "createdAt": "...",
    "updatedAt": "...",
    "__v": 0
  }
  ```

---

### 2. Get Messages with a User

- **Endpoint:** `GET /api/v1/chat/:id`
- **Description:** Get all messages between the current user and user with ID `:id`.
- **Response:**
  ```json
  [
    {
      "_id": "...",
      "senderId": { "_id": "...", "firstName": "...", "lastName": "...", "profilePicture": "..." },
      "receiverId": { "_id": "...", "firstName": "...", "lastName": "...", "profilePicture": "..." },
      "message": "...",
      "read": false,
      "createdAt": "...",
      "updatedAt": "...",
      "__v": 0
    },
    ...
  ]
  ```

---

### 3. Get All Conversations

- **Endpoint:** `GET /api/v1/chat/conversations`
- **Description:** Get all conversations for the current user, including the other user's info, the last message, and the unread message count.
- **Response:**
  ```json
  [
    {
      "conversationId": "...",
      "user": { "_id": "...", "firstName": "...", "lastName": "...", "profilePicture": "..." },
      "lastMessage": {
        "_id": "...",
        "senderId": { "_id": "...", "firstName": "...", "lastName": "...", "profilePicture": "..." },
        "receiverId": { "_id": "...", "firstName": "...", "lastName": "...", "profilePicture": "..." },
        "message": "...",
        "read": false,
        "createdAt": "...",
        "updatedAt": "...",
        "__v": 0
      },
      "unreadCount": 3
    },
    ...
  ]
  ```

---

### 4. Mark Messages as Read (Unread Badge)

- **Endpoint:** `POST /api/v1/chat/:id/read`
- **Description:**
  - Marks all messages in the conversation **from user `:id` to the current user** as read.
  - This endpoint should be called when the user opens a chat window with another user, indicating that all previously unread messages from that user have now been seen.
  - After calling this endpoint, the unread badge for that conversation will be cleared (set to 0) for the current user.
- **When to Call:**
  - Call this endpoint as soon as the user navigates to or opens a chat with another user (e.g., when the chat window becomes active or visible).
  - You do **not** need to call it for every message; one call per chat open is enough.
- **Request Body:** _none_
- **Response:**
  ```json
  { "success": true }
  ```
- **Usage Scenario:**
  1. User sees a badge (e.g., "3") on a conversation in the chat list, indicating 3 unread messages.
  2. User clicks the conversation to open the chat window.
  3. Frontend immediately calls `POST /api/v1/chat/:id/read` (where `:id` is the other user's ID).
  4. The backend marks all messages from that user to the current user as read.
  5. The unread badge disappears (or is set to 0) in the UI.
- **Effect:**
  - The next time you call `GET /api/v1/chat/conversations`, the `unreadCount` for that conversation will be 0 (until new messages arrive).

---

## Real-Time Chat (Socket.IO)

- **WebSocket URL:**
  - Local: `ws://localhost:4000/chat`
  - Production: `wss://backend-ui4w.onrender.com/chat`
- **Connection Example (frontend JS):**
  ```js
  const socket = io("wss://backend-ui4w.onrender.com", {
    path: "/chat",
    query: { userId: USER_ID },
  });
  ```
- **Events:**
  - `newMessage`: Receive new messages in real time.
    ```js
    socket.on("newMessage", (msg) => {
      // msg: same structure as REST response
    });
    ```
  - `getOnlineUsers`: Receive list of currently online user IDs.
    ```js
    socket.on("getOnlineUsers", (userIds) => {
      // userIds: array of user IDs
    });
    ```

---

## Why Document the Real-Time (Socket.IO) Connection?

1. **Clarity for Frontend Developers:**

   - It tells them exactly how to connect to your real-time chat server, both locally and in production.
   - It specifies the correct WebSocket URL and path (`/chat`), which is critical for a successful connection.

2. **Prevents Common Mistakes:**

   - If the frontend uses the wrong URL, protocol (`ws://` vs `wss://`), or path, real-time chat will not work.
   - The example code shows the correct way to pass the user ID and listen for events.

3. **Consistency:**

   - Ensures all team members (and future developers) use the same integration method.
   - Reduces onboarding time for new developers.

4. **Debugging:**
   - If something doesn’t work, you can quickly check if the frontend is connecting as documented.

---

## Notes

- All endpoints require authentication.
- All user IDs are MongoDB ObjectIds as strings.
- All timestamps are ISO strings.
- For avatars, use the `profilePicture` field if available.
