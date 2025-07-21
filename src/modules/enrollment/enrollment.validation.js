import { body, param } from "express-validator";
import { isValidObjectId } from "../../middlewares/validation.middleware.js";

export const enrollInHalakaValidation = [
  body("id")
    .notEmpty()
    .withMessage("Halaka ID is required.")
    .isString()
    .withMessage("Halaka ID must be a string.")
    .custom((value) => {
      return isValidObjectId(value);
    })
    .withMessage("Invalid Halaka ID format.")
    .trim()
    .escape(),
];

export const actOnInvitationValidation = [
  param("id")
    .notEmpty()
    .withMessage("Enrollment ID is required.")
    .custom((value) => isValidObjectId(value))
    .withMessage("Invalid Enrollment ID format."),
  body("action")
    .notEmpty()
    .withMessage("Action is required.")
    .isIn(["accept", "reject"])
    .withMessage("Action must be either 'accept' or 'reject'."),
];
