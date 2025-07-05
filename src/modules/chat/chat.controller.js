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
    }).populate("message");

    if (!conversation) return res.status(200).json([]);

    const messages = conversation.message;

    res.status(200).json(messages);
}); 