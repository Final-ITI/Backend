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
router.get("/", authenticate, authorize("teacher"), getAllHalakat);
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
export default router;
