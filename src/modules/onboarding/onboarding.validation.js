import { body, param } from "express-validator";
import { isValidObjectId } from "../../middlewares/validation.middleware.js";

export const profileValidation = [
  body("specialization")
    .notEmpty()
    .withMessage("Specialization is required.")
    .isIn([
      "quran_memorization",
      "quran_recitation",
      "tajweed",
      "arabic_language",
      "fiqh",
      "hadith",
      "aqeedah",
    ])
    .withMessage(
      "Specialization must be one of: quran_memorization, quran_recitation, tajweed, arabic_language, fiqh, hadith, aqeedah"
    )
    .trim()
    .escape(),

  body("bio")
    .notEmpty()
    .withMessage("Bio is required.")
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters.")
    .trim()
    .escape(),

  body("skills")
    .notEmpty()
    .withMessage("Skills are required.")
    .isLength({ max: 200 })
    .withMessage("Skills cannot exceed 200 characters.")
    .trim()
    .escape(),

  body("experience")
    .notEmpty()
    .withMessage("Experience is required.")
    .isInt({ min: 0, max: 50 })
    .withMessage("Experience must be between 0 and 50 years.")
    .toInt()
    .trim()
    .escape(),

  body("sessionPrice")
    .notEmpty()
    .withMessage("Session price is required.")
    .isNumeric()
    .withMessage("Session price must be a number.")
    .isFloat({ min: 1 })
    .withMessage("Session price must be at least 1.")
    .toFloat()
    .trim()
    .escape(),

  // body("currency")
  // .optional()
  // .isString()
  // .withMessage("Currency must be a string.")
  // .isIn(["EGP", "USD", "EUR"])
  // .withMessage("Currency must be one of: EGP, USD, EUR")
  // .trim()
  // .escape(),

  body("id_number")
    .notEmpty()
    .withMessage("ID number is required.")
    .isString()
    .withMessage("ID number must be a string.")
    .isLength({ min: 14, max: 14 })
    .withMessage("ID number must be exactly 14 characters long.")
    .trim()
    .escape(),
];

export const documentUploadValidation = [
  body("docType")
    .notEmpty()
    .withMessage("Document type is required.")
    .isIn([
      "national_id_front",
      "national_id_back",
      "birth_certificate",
      "guardian_id",
      "teacher_certificate",
      "other",
    ])
    .withMessage(
      "Document type must be one of: national_id_front, national_id_back, birth_certificate, guardian_id, teacher_certificate, other"
    )
    .trim()
    .escape(),
];

export const deleteDocumentValidation = [
  param("docId")
    .notEmpty()
    .withMessage("Document ID is required.")
    .isString()
    .withMessage("Document ID must be a string.")
    .custom((value) => {
      return isValidObjectId(value);
    })
    .withMessage("Invalid document ID format.")
    .trim()
    .escape(),
];
