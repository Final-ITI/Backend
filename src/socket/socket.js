import { Server } from "socket.io";
import ChatGroup from "../../DB/models/chatGroup.js";


let io = null;
export const userSocketMap = {};

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

export const initSocket = (ioInstance) => {
  io = ioInstance;

  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") userSocketMap[userId] = socket.id;

    // --- GROUP CHAT: Auto-join all group rooms ---
    if (userId && userId !== "undefined") {
      try {
        // Find all chat groups the user is a participant in
        const groups = await ChatGroup.find({ participants: userId }, "_id");
        groups.forEach(group => {
          socket.join(`group_${group._id}`);
        });
      } catch (err) {
        console.error("Error auto-joining group rooms:", err);
      }
    }
    // --- END GROUP CHAT ---

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      console.log("user disconnected", socket.id);
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });
};

// Helper to emit a message to a group room
export const emitGroupMessage = (groupId, event, data) => {
  if (io) {
    io.to(`group_${groupId}`).emit(event, data);
  }
};

export { io }; 