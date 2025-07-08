import express from "express";
import { sendMessage, getMessages, getConversations, markAsRead } from "./chat.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { body } from "express-validator";
import { validate } from "../../middlewares/validation.middleware.js";

const router = express.Router();

router.post(
  "/send/:id",
  authenticate,
  validate([body("message").notEmpty().withMessage("Message content is required")]),
  sendMessage
);

router.get("/conversations", authenticate, getConversations);
router.get("/:id", authenticate, getMessages);
router.post("/:id/read", authenticate, markAsRead);

export default router; 