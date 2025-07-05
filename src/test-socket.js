import { io } from "socket.io-client";

const USER_ID = "6862d2ec4fe3da7d2e9d417c"; 

const socket = io("ws://localhost:4000", {
    path: "/chat",
    query: { userId: USER_ID }
  });

socket.on("connect", () => {
    console.log("Connected to Socket.IO server:", socket.id);
});

socket.on("getOnlineUsers", (users) => {
    console.log("Online users:", users);
});

socket.on("newMessage", (msg) => {
    console.log("Received new message:", msg);
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});
