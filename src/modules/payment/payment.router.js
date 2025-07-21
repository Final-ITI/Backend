import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { initiatePayment } from "./payment.controller.js";

const router = Router();

router.use(authenticate, authorize("student"));
// /api/v1/payment/initiate - Initiate payment for enrollment
router.post('/initiate',initiatePayment)

export default router;