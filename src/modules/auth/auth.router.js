import { Router } from "express";
import { validate } from "../../middlewares/validation.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  activateCodeEmailValidation,
  loginValidation,
  registerValidation,
  logoutValidation,
  refreshTokenValidation,
} from "./auth.validation.js";
import {
  register,
  activateEmail,
  login,
  logout,
  refreshToken,
  logoutAllDevices,
} from "./auth.controller.js";

const router = Router();

// Public routes
router.post("/register", validate(registerValidation), register);
router.get(
  "/activate/:activationCodeEmail",
  validate(activateCodeEmailValidation),
  activateEmail
);
router.post("/login", validate(loginValidation), login);
router.post("/logout", validate(logoutValidation), logout);
router.post("/refresh-token", validate(refreshTokenValidation), refreshToken);

// Protected routes (require authentication)
router.post("/logout-all", authenticate, logoutAllDevices);


export default router;
