// routes/webhook.router.js
import express from "express";
import { zoomAttendanceWebhook } from "./webhook.controller.js";
const router = express.Router();

router.post("/zoom/attendance", zoomAttendanceWebhook);
export default router;
