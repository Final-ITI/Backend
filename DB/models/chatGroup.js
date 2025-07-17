import mongoose from "mongoose";
const Schema = mongoose.Schema;

const chatGroupSchema = new Schema(
  {
    halaka: { type: Schema.Types.ObjectId, ref: "Halaka", required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
  },
  { timestamps: true }
);

const ChatGroup = mongoose.models.ChatGroup || mongoose.model("ChatGroup", chatGroupSchema);
export default ChatGroup; 