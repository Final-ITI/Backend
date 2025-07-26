import mongoose from "mongoose";
import Conversation from "../../../DB/models/conversation.js";
import Message from "../../../DB/models/message.js";
import ApiError, { asyncHandler } from "../../utils/apiError.js";
import { userSocketMap, io, emitGroupMessage } from "../../socket/socket.js";
import ChatGroup from "../../../DB/models/chatGroup.js";

export const sendMessage = asyncHandler(async (req, res) => {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!message || !receiverId) {
        throw new ApiError("محتوى الرسالة ومعرّف المستلم مطلوبان", 400);
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
        throw new ApiError("مطلوب تحديد المستخدم للمحادثة معه", 400);
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
    res.status(200).json({ success: true, modifiedCount: result.modifiedCount, message: "تم تعليم الرسائل كمقروءة بنجاح" });
});

export const sendGroupMessage = asyncHandler(async (req, res) => {
    const { message } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    if (!message || !groupId) {
        throw new ApiError("محتوى الرسالة ومعرّف المجموعة مطلوبان", 400);
    }

    const chatGroup = await ChatGroup.findById(groupId);
    if (!chatGroup) throw new ApiError("المجموعة غير موجودة", 404);
    if (!chatGroup.participants.map(id => id.toString()).includes(senderId.toString())) {
        throw new ApiError("أنت لست مشاركاً في هذه المجموعة", 403);
    }

    let conversation = await Conversation.findOne({ chatGroup: groupId });
    if (!conversation) {
        conversation = await Conversation.create({
            participants: chatGroup.participants,
            chatGroup: groupId,
        });
    }

    const newMessage = new Message({
        senderId,
        message,
    });
    conversation.message.push(newMessage._id);
    await Promise.all([conversation.save(), newMessage.save()]);

    // This ensures the frontend receives the full sender object, not just an ID.
    const populatedMessage = await newMessage.populate({
        path: "senderId",
        select: "firstName lastName profilePicture",
    });

    // Emit to all group participants in real time
    emitGroupMessage(groupId, "groupMessage", {
        message: populatedMessage,
        groupId,
    });

    res.status(201).json(newMessage);
});

export const getGroupMessages = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const userId = req.user._id;

    const chatGroup = await ChatGroup.findById(groupId);
    if (!chatGroup) throw new ApiError("المجموعة غير موجودة", 404);
    if (!chatGroup.participants.map(id => id.toString()).includes(userId.toString())) {
        throw new ApiError("أنت لست مشاركاً في هذه المجموعة", 403);
    }

    const conversation = await Conversation.findOne({ chatGroup: groupId }).populate({
        path: "message",
        populate: [
            { path: "senderId", select: "firstName lastName profilePicture" },
            { path: "receiverId", select: "firstName lastName profilePicture" }
        ]
    });
    if (!conversation) return res.status(200).json([]);
    res.status(200).json(conversation.message);
});

export const getGroupInfo = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const userId = req.user._id;
    const chatGroup = await ChatGroup.findById(groupId).populate({
        path: "participants",
        select: "firstName lastName profilePicture"
    });
    if (!chatGroup) throw new ApiError("المجموعة غير موجودة", 404);
    if (!chatGroup.participants.map(p => p._id.toString()).includes(userId.toString())) {
        throw new ApiError("أنت لست مشاركاً في هذه المجموعة", 403);
    }
    res.status(200).json(chatGroup);
});

