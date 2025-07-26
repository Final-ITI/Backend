import { body, param } from "express-validator";
import { isValidObjectId } from "../../middlewares/validation.middleware.js";

export const profileValidation = [
  body("specialization")
    .notEmpty()
    .withMessage("التخصص مطلوب.")
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
      "يجب أن يكون التخصص أحد الخيارات التالية: quran_memorization, quran_recitation, tajweed, arabic_language, fiqh, hadith, aqeedah"
    )
    .trim()
    .escape(),

  body("bio")
    .notEmpty()
    .withMessage("النبذة الذاتية مطلوبة.")
    .isLength({ max: 500 })
    .withMessage("لا يمكن أن تتجاوز النبذة الذاتية 500 حرف.")
    .trim()
    .escape(),

  body("skills")
    .notEmpty()
    .withMessage("المهارات مطلوبة.")
    .isLength({ max: 200 })
    .withMessage("لا يمكن أن تتجاوز المهارات 200 حرف.")
    .trim()
    .escape(),

  body("experience")
    .notEmpty()
    .withMessage("الخبرة مطلوبة.")
    .isInt({ min: 0, max: 50 })
    .withMessage("يجب أن تتراوح الخبرة بين 0 و 50 عامًا.")
    .toInt()
    .trim()
    .escape(),

  body("sessionPrice")
    .notEmpty()
    .withMessage("سعر الجلسة مطلوب.")
    .isNumeric()
    .withMessage("يجب أن يكون سعر الجلسة رقمًا.")
    .isFloat({ min: 1 })
    .withMessage("يجب أن يكون سعر الجلسة 1 على الأقل.")
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
    .withMessage("رقم الهوية مطلوب.")
    .isString()
    .withMessage("يجب أن يكون رقم الهوية سلسلة نصية.")
    .isLength({ min: 14, max: 14 })
    .withMessage("يجب أن يتكون رقم الهوية من 14 حرفًا بالضبط.")
    .trim()
    .escape(),
];

export const documentUploadValidation = [
  body("docType")
    .notEmpty()
    .withMessage("نوع المستند مطلوب.")
    .isIn([
      "national_id_front",
      "national_id_back",
      "birth_certificate",
      "guardian_id",
      "certificates",
      "other",
    ])
    .withMessage(
      "يجب أن يكون نوع المستند أحد الخيارات التالية: national_id_front, national_id_back, birth_certificate, guardian_id, teacher_certificate, other"
    )
    .trim()
    .escape(),
];

export const deleteDocumentValidation = [
  param("docId")
    .notEmpty()
    .withMessage("معرف المستند مطلوب.")
    .isString()
    .withMessage("يجب أن يكون معرف المستند سلسلة نصية.")
    .custom((value) => {
      return isValidObjectId(value);
    })
    .withMessage("صيغة معرف المستند غير صالحة.")
    .trim()
    .escape(),
];
