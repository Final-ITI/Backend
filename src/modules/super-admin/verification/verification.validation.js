import {  param } from "express-validator";
import { query } from "express-validator";
import { isValidObjectId } from "../../../middlewares/validation.middleware.js";

export const getVerificationRequestsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
    
  query("verificationStatus")
    .optional()
    .isIn(["pending", "approved", "rejected"])
    .withMessage("Invalid verification status"),
    
  query("q")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Search query must be between 2-100 characters")
    .trim(),
];

export const validateId =[
  param("teacherId")
    .exists()
    .withMessage("Teacher ID is required")
    .custom(isValidObjectId)
    .withMessage("Invalid Teacher ID format"),
]