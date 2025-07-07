import {
  authenticate,
  authorize,
} from "../../../middlewares/auth.middleware.js";
import { validate,validateId } from "../../../middlewares/validation.middleware.js";

import { Router } from "express";
import { getVerificationRequests } from "./verification.controller.js";
import { getVerificationRequestsValidation , getVerificationRequestById } from "./verification.validation.js";

const router = Router();
router.use(authenticate, authorize("superadmin"));

router.get(
  "/",
  validate(getVerificationRequestsValidation),
  getVerificationRequests
);

router.get('/:teacherId',validate(validateId), )

export default router;
