import {  body, param } from "express-validator";
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

const createIdValidator = (paramName, fieldName) => [
  param(paramName)
    .exists()
    .withMessage(`${fieldName} ID is required`)
    .custom(isValidObjectId)
    .withMessage(`Invalid ${fieldName} ID format`),
];

export const validateTeacherId = createIdValidator("teacherId", "Teacher");
export const validateDocumentId = createIdValidator("documentId", "Document");

export const updateTeacherVerificationStatusValidation = [
  param("teacherId")
    .exists()
    .withMessage("Teacher ID is required")
    .custom(isValidObjectId)
    .withMessage("Invalid Teacher ID format"),
    
  body("action")
    .exists()
    .withMessage("Action is required")
    .isIn(["approve", "reject"])
    .withMessage("Action must be either 'approve' or 'reject'"),
]