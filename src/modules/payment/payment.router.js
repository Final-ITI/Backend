import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { initiatePayment, paymobPaymentWebhook } from "./payment.controller.js";

const router = Router();


// /api/v1/payment/initiate - Initiate payment for enrollment
router.post('/initiate',authenticate, authorize("student"),initiatePayment)
router.post("/webhook/paymob", paymobPaymentWebhook);
export default router;