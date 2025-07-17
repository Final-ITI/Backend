import { Router } from "express";
import { sendContactForm } from "./contact.controller.js";

const router = Router();

router.post("/contact", sendContactForm);

export default router; 