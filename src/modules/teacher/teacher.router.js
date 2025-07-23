import { Router } from "express";
import { getFreelanceTeachers } from "./teacher.controller.js";
import {
  getTeacherProfile,
  updateTeacherProfile,
  uploadTeacherDocument,
  listTeacherDocuments,
  deleteTeacherDocument,
} from "./teacher.profile.controller.js";
import { authenticate , authorize } from '../../middlewares/auth.middleware.js';
import multer from "multer";
import { validate } from "../../middlewares/validation.middleware.js";
import { updateProfileValidation, uploadDocumentValidation } from "./teacher.profile.validation.js";

const router = Router();

router.get("/", getFreelanceTeachers);

// Profile endpoints
router.get("/profile", authenticate, authorize('teacher') , getTeacherProfile);
router.put("/profile",  authenticate, authorize('teacher') , validate(updateProfileValidation), updateTeacherProfile);

// Document endpoints
const upload = multer();
router.post("/profile/documents",  authenticate, authorize('teacher') , upload.single("file"), validate(uploadDocumentValidation), uploadTeacherDocument);
router.get("/profile/documents", authenticate, authorize('teacher') , listTeacherDocuments);
router.delete("/profile/documents/:id", authenticate , authorize('teacher') , deleteTeacherDocument);

export default router;
