import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { initiatePayment, paymobPaymentWebhook } from "./payment.controller.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { initiatePaymentValidation } from "./payment.validation.js";

const router = Router();


// /api/v1/payment/initiate - Initiate payment for enrollment
router.post('/initiate',authenticate, authorize("student"), validate(initiatePaymentValidation),initiatePayment)
router.post("/webhook/paymob", paymobPaymentWebhook);
export default router;