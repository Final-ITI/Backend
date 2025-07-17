import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    message: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Message",
      },
    ],
    chatGroup: {
      type: mongoose.Schema.ObjectId,
      ref: "ChatGroup",
      default: null,
    }, // New: link to ChatGroup for group chat
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation; 