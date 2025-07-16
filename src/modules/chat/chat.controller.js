import mongoose from "mongoose";
import Conversation from "../../../DB/models/conversation.js";
import Message from "../../../DB/models/message.js";
import ApiError, { asyncHandler } from "../../utils/apiError.js";
import { userSocketMap, io } from "../../socket/socket.js";

export const sendMessage = asyncHandler(async (req, res) => {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!message || !receiverId) {
        throw new ApiError("Message content and receiver ID are required", 400);
    }

    let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
        conversation = await Conversation.create({
            participants: [senderId, receiverId],
        });
    }

    const newMessage = new Message({
        senderId,
        receiverId,
        message,
    });

    conversation.message.push(newMessage._id);
    await Promise.all([conversation.save(), newMessage.save()]);

    // Emit directly to receiver's socket
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
        // Emit a notification event as well
        io.to(receiverSocketId).emit("notification", {
            type: "chat",
            message: "لديك رسالة جديدة",
            from: senderId,
            conversationId: conversation._id,
            messageId: newMessage._id
        });
    }

    res.status(201).json(newMessage);
});

export const getMessages = asyncHandler(async (req, res) => {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    if (!userToChatId) {
        throw new ApiError("User to chat with is required", 400);
    }

    const conversation = await Conversation.findOne({
        participants: { $all: [senderId, userToChatId] },
    }).populate({
        path: "message",
        populate: [
            { path: "senderId", select: "firstName lastName profilePicture" },
            { path: "receiverId", select: "firstName lastName profilePicture" }
        ]
    });

    if (!conversation) return res.status(200).json([]);

    const messages = conversation.message;

    res.status(200).json(messages);
});

export const getConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Find all conversations where the user is a participant
    const conversations = await Conversation.find({
        participants: userId
    })
        .populate({
            path: "participants",
            select: "firstName lastName profilePicture"
        })
        .populate({
            path: "message",
            options: { sort: { createdAt: 1 } }, // oldest to newest
            populate: [
                { path: "senderId", select: "firstName lastName profilePicture" },
                { path: "receiverId", select: "firstName lastName profilePicture" }
            ]
        });

    // Format the response: for each conversation, return the other user, the last message, and unread count
    const result = await Promise.all(conversations.map(async conv => {
        // Get the other participant
        const otherUser = conv.participants.find(p => p._id.toString() !== userId.toString());
        // Get the last message (most recent)
        const lastMessage = Array.isArray(conv.message) && conv.message.length > 0
            ? conv.message[conv.message.length - 1]
            : null;
        // Count unread messages for this conversation
        let unreadCount = 0;
        if (conv.message && conv.message.length > 0) {
            unreadCount = conv.message.filter(
                m => m.receiverId && m.receiverId._id && m.receiverId._id.toString() === userId.toString() && !m.read
            ).length;
        }
        return {
            conversationId: conv._id,
            user: otherUser,
            lastMessage,
            unreadCount
        };
    }));

    res.status(200).json(result);
});

export const markAsRead = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const otherUserId = new mongoose.Types.ObjectId(req.params.id);

    const result = await Message.updateMany(
        {
            senderId: otherUserId,
            receiverId: userId,
            read: false,
        },
        { $set: { read: true } }
    );

    console.log("markAsRead result:", result);
    res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
});

