import {
  authenticate,
  authorize,
} from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validation.middleware.js";

import { Router } from "express";
import {  getTeacherVerificationDetails, getVerificationRequests, reviewDocument,  updateTeacherVerificationStatus } from "./verification.controller.js";
import { getVerificationRequestsValidation,  updateTeacherVerificationStatusValidation,  validateDocumentId,  validateTeacherId  } from "./verification.validation.js";

const router = Router();
router.use(authenticate, authorize("superadmin"));

router.get(
  "/",
  validate(getVerificationRequestsValidation),
  getVerificationRequests
);

router.get('/:teacherId',validate(validateTeacherId), getTeacherVerificationDetails);

router.post('/documents/:documentId/review', validate(validateDocumentId), reviewDocument);

// Update teacher verification status
router.patch('/:teacherId/status', validate(updateTeacherVerificationStatusValidation), updateTeacherVerificationStatus);


export default router;
