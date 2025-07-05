import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import connectionDB from "../DB/connection.js";
import { initSocket, userSocketMap, io } from "./socket/socket.js";
import Redis from "ioredis";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const ioInstance = new SocketIOServer(httpServer, {
    path: "/chat",
    cors: {
        origin: "*", // Adjust as needed for security
        methods: ["GET", "POST"],
    },
});

connectionDB();

initSocket(ioInstance);

// Redis subscriber for chat messages
const redisSubscriber = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
});

redisSubscriber.subscribe("chat:messages", (err, count) => {
    if (err) {
        console.error("❌ Redis subscribe error:", err);
    } else {
        console.log(`✅ Subscribed to chat:messages (${count} channels)`);
    }
});

redisSubscriber.on("message", (channel, message) => {
    if (channel === "chat:messages") {
      try {
        const { receiverId, message: msg } = JSON.parse(message);
        console.log('Received from Redis:', { receiverId, msg });
        const receiverSocketId = userSocketMap[receiverId];
        console.log('receiverSocketId:', receiverSocketId, 'userSocketMap:', userSocketMap);
        if (receiverSocketId) {
          ioInstance.to(receiverSocketId).emit("newMessage", msg);
        }
      } catch (err) {
        console.error("❌ Error handling chat:messages:", err);
      }
    }
  });

const port = 6001;
httpServer.listen(port, () => {
    console.log(`✅ Socket.IO Chat Server is running on PORT ${port} (path: /chat)`);
}); 