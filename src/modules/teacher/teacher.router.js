import { Router } from "express";
import { getFreelanceTeachers } from "./teacher.controller.js";
import {
  getTeacherProfile,
  updateTeacherProfileAndDocument,
  listTeacherDocuments,
  deleteTeacherDocument,
} from "./teacher.profile.controller.js";
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import multer from "multer";
import { validate } from "../../middlewares/validation.middleware.js";
import { updateProfileValidation, uploadDocumentValidation } from "./teacher.profile.validation.js";
import { getTeacherDetails } from "./teacher.controller.js";

const router = Router();

router.get("/", getFreelanceTeachers);

// New endpoint for getting teacher details by ID
router.get("/:id", getTeacherDetails);

// Profile endpoints
router.get("/profile", authenticate, authorize('teacher'), getTeacherProfile);

// Single endpoint for profile update and document upload (one form/process)
const upload = multer();
router.put(
  "/profile",
  authenticate,
  authorize('teacher'),
  upload.single("file"),
  validate(updateProfileValidation),
  validate(uploadDocumentValidation),
  updateTeacherProfileAndDocument
);

// Document endpoints (list & delete only, upload handled in profile PUT)
router.get("/profile/documents", authenticate, authorize('teacher'), listTeacherDocuments);
router.delete("/profile/documents/:id", authenticate, authorize('teacher'), deleteTeacherDocument);

export default router;
