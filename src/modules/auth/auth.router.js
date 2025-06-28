import { Router } from "express";
import { validate } from "../../middlewares/validation.middleware.js";
import { registerValidation } from "./auth.validation.js";
import { register } from "./auth.controller.js";

const router = Router();

// Register 
router.post("/register", validate(registerValidation),register);


export default router