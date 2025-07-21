import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import {
  enrollInGroupHalaka,
  getPendingInvitations,
  getInvitationDetails,
  actOnInvitation,
} from "./enrollment.controller.js";
import {
  enrollInHalakaValidation,
  actOnInvitationValidation,
} from "./enrollment.validation.js";
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

// GET /api/v1/enrollments/invitations - List all pending invitations for the logged-in student
router.get(
  "/invitations",
  authenticate,
  authorize("student"),
  getPendingInvitations
);

// GET /api/v1/enrollments/invitations/:id - Get single invitation details for the authenticated student
router.get(
  "/invitations/:id",
  authenticate,
  authorize("student"),
  getInvitationDetails
);

// PATCH /api/v1/enrollments/invitations/:id - Accept or reject a specific invitation
router.patch(
  "/invitations/:id",
  authenticate,
  authorize("student"),
  validate(actOnInvitationValidation),
  actOnInvitation
);

export default router;
