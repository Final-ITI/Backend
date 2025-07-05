import { body, param } from "express-validator";

export const registerValidation = [
  body("firstName")
    .notEmpty()
    .withMessage("First name is required.")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters long.")
    .trim()
    .escape(),

  body("lastName")
    .notEmpty()
    .withMessage("Last name is required.")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters long.")
    .trim()
    .escape(),

  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    // .custom((value) => {
    //   const lowerCaseEmail = value.toLowerCase();
    //   if (
    //     !lowerCaseEmail.endsWith("@gmail.com") &&
    //     !lowerCaseEmail.endsWith("@outlook.com")
    //   ) {
    //     throw new Error("Only Gmail or Outlook email addresses are allowed.");
    //   }
    //   return true;
    // })
    .normalizeEmail(),

  body("password")
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[#?!@$%^&*-]).{8,}$/)
    .withMessage(
      "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number and one special character (#?!@$%^&*-)."
    ),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Confirm password does not match.");
    }
    return true;
  }),

  body("role")
    .notEmpty()
    .isIn(["student", "teacher"])
    .withMessage("Role must be either 'student' or 'teacher'.")
    .trim()
    .escape(),

  body("gender")
    .notEmpty()
    .isIn(["male", "female"])
    .withMessage("Gender must be either 'male' or 'female'."),

  body("country")
    .notEmpty()
    .withMessage("Country is required.")
    .isLength({ min: 2, max: 50 })
    .withMessage("Country must be between 2 and 50 characters long.")
    .trim()
    .escape(),
];

export const activateCodeEmailValidation = [
  param("activationCodeEmail")
    .notEmpty()
    .withMessage("Activation code is required.")
    .isString()
    .withMessage("Activation code must be a string.")
    .trim()
    .escape(),
];

export const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required."),
];




