import express from "express";
import {
  createHalaka,
  getAllHalakat,
  getHalakaById,
  updateHalaka,
  deleteHalaka,
  getHalakatByTeacher,
  getUpcomingSessions,
  getHalakaAttendance,
  cancelSession,
  getCancelledSessions,
  restoreSession,
  getSessionAnalytics,
  getHalakaStudents,
} from "./halaka.controller.js";
import {
  createHalakaValidation,
  updateHalakaValidation,
} from "./halaka.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";

import { authorize, authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("teacher"),
  validate(createHalakaValidation),
  createHalaka
);

router.get("/", getAllHalakat);
router.get("/:id", authenticate, authorize("teacher"), getHalakaById);
router.put(
  "/:id",
  authenticate,
  authorize("teacher"),
  validate(updateHalakaValidation),
  updateHalaka
);
router.delete("/:id", authenticate, authorize("teacher"), deleteHalaka);
router.get(
  "/teacher/:teacherId",
  authenticate,
  authorize("teacher"),
  getHalakatByTeacher
);

// Endpoint to get upcoming sessions for a specific Halaka
router.get(
  "/:id/next-sessions",
  authenticate,
  authorize("teacher"),
  getUpcomingSessions
);

//attendance
router.get(
  "/:id/attendance",
  authenticate,
  authorize("teacher"),
  getHalakaAttendance
);

router.get(
  "/:id/students",
  authenticate,
  authorize("teacher"),
  getHalakaStudents
);

//session cancelation
// Cancel a specific session
router.post(
  "/:id/cancel-session",
  authenticate,
  authorize("teacher"),
  cancelSession
);

// Get cancelled sessions for a halaka
router.get(
  "/:id/cancelled-sessions",
  authenticate,
  authorize("teacher"),
  getCancelledSessions
);

// Restore a cancelled session
router.post(
  "/:id/restore-session",
  authenticate,
  authorize("teacher"),
  restoreSession
);

// Get session analytics for a specific Halaka
router.get(
  "/:id/session-analytics",
  authenticate,
  authorize("teacher"),
  getSessionAnalytics
);

export default router;
