import express from "express";
import dotenv from "dotenv";
import connectionDB from "./DB/connection.js";
import { appRouter } from "./src/app.router.js";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { userSocketMap, initSocket } from "./src/socket/socket.js";

dotenv.config();
const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  path: "/chat",
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"],
  },
});

connectionDB();
appRouter(app, express);
initSocket(io);

const port = process.env.PORT || 4000;
httpServer.listen(port, () => {
  console.log(`✅ Server is running on PORT ${port}`);
});
