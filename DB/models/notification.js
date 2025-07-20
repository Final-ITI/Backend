// DB/models/notification.js
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    /**
     * @desc The type of notification, to handle it differently on the frontend.
     */
    type: {
      type: String,
      required: true,
      enum: ["chat_message", "halaka_invitation", "payment_success", "system_alert"],
    },

    message: {
      type: String,
      required: true,
    },

    /**
     * @desc A link to navigate to when the notification is clicked.
     */
    link: {
      type: String,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;