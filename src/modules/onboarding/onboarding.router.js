import {
  attachProfileByRole,
  authenticate,
  authorize,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  deleteDocumentValidation,
  documentUploadValidation,
  profileValidation,
} from "./onboarding.validation.js";
import {
  profile,
  uploadMyDocument,
  deleteMyDocument,
  submitForReview,
  getMyVerificationStatus,
} from "./onboarding.controller.js";
import { Router } from "express";
import { createUploadMiddleware, fileType } from "../../utils/multer.js";

const router = Router();

router.use(authenticate, authorize("teacher"));

// profile
router.put(
  "/profile",
  validate(profileValidation),
  profile
);

// File upload types
const uploadDocumentMiddleware = createUploadMiddleware([
  ...fileType.IMAGE,
  ...fileType.PDF,
]).single("document");

// document upload
router.post(
  "/documents",

  uploadDocumentMiddleware,
  validate(documentUploadValidation),
  attachProfileByRole,
  uploadMyDocument
);

// Delete document
router.delete(
  "/documents/:docId",
  validate(deleteDocumentValidation),
  attachProfileByRole,
  deleteMyDocument
);

// Submit for review
router.post("/submit-for-review", submitForReview);

// Get verification status
router.get("/verification-status", getMyVerificationStatus);

export default router;
