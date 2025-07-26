import express from "express";
import { sendMessage, getMessages, getConversations, markAsRead, sendGroupMessage, getGroupMessages, getGroupInfo } from "./chat.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { body } from "express-validator";
import { validate } from "../../middlewares/validation.middleware.js";

const router = express.Router();

router.post(
  "/send/:id",
  authenticate,
  validate([body("message").notEmpty().withMessage("محتوى الرسالة مطلوب")]),
  sendMessage
);

router.get("/conversations", authenticate, getConversations);
router.get("/:id", authenticate, getMessages);
router.post("/:id/read", authenticate, markAsRead);

router.post(
  "/group/:groupId/message",
  authenticate,
  validate([body("message").notEmpty().withMessage("محتوى الرسالة مطلوب")]),
  sendGroupMessage
);

router.get("/group/:groupId/messages", authenticate, getGroupMessages);
router.get("/group/:groupId", authenticate, getGroupInfo);

export default router;