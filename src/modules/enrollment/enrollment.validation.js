import { body } from "express-validator";
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
