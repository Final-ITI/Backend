import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { enrollInGroupHalaka } from "./enrollment.controller.js";
import { enrollInHalakaValidation } from "./enrollment.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";

const router = Router();

// POST /api/v1/enrollments/group - Enroll in a group halaka
router.post(
  "/group",
  authenticate,
  authorize("student"),
  validate(enrollInHalakaValidation),
  enrollInGroupHalaka
);

export default router;
