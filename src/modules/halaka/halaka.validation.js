import { body } from "express-validator";

// Arabic validation messages
const messages = {
  required: (field) => `حقل «${field}» مطلوب`,
  mustBeString: (field) => `حقل «${field}» يجب أن يكون نصًا`,
  mustBeObject: (field) => `حقل «${field}» يجب أن يكون كائنًا`,
  invalidEnum: (field, list) =>
    `قيمة «${field}» غير صحيحة، القيم المسموح بها: ${list.join("، ")}`,
  mustBeDate: (field) => `«${field}» يجب أن يكون تاريخًا بصيغة ISO 8601`,
  mustBeTime: (field) => `«${field}» يجب أن يكون بتنسيق HH:mm`,
  mustBePositiveInt: (field) => `«${field}» يجب أن يكون رقمًا صحيحًا موجبًا`,
  mustBePositiveNum: (field) => `«${field}» يجب أن يكون رقمًا موجبًا`,
  mustBeObjectId: (field) => `«${field}» يجب أن يكون ObjectId صحيحًا`,
  mustBeArray: (field) => `«${field}» يجب أن يكون مصفوفة`,
  maxLength: (field, max) => `«${field}» لا يجب أن يتجاوز ${max} حرف`,
};

export const createHalakaValidation = [
  body("title")
    .notEmpty()
    .withMessage(messages.required("العنوان"))
    .isString()
    .withMessage(messages.mustBeString("العنوان")),

  body("halqaType")
    .notEmpty()
    .withMessage(messages.required("نوع الحلقة"))
    .isIn(["private", "halqa"])
    .withMessage(messages.invalidEnum("نوع الحلقة", ["private", "halqa"])),

  body("schedule")
    .notEmpty()
    .withMessage(messages.required("الجدول"))
    .isObject()
    .withMessage(messages.mustBeObject("الجدول")),

  body("schedule.startDate")
    .notEmpty()
    .withMessage(messages.required("تاريخ البداية"))
    .isISO8601()
    .withMessage(messages.mustBeDate("تاريخ البداية")),

  body("schedule.endDate")
    .notEmpty()
    .withMessage(messages.required("تاريخ النهاية"))
    .isISO8601()
    .withMessage(messages.mustBeDate("تاريخ النهاية")),

  body("schedule.days")
    .isArray({ min: 1 })
    .withMessage("يجب اختيار يوم واحد على الأقل في الجدول"),

  body("schedule.startTime")
    .notEmpty()
    .withMessage(messages.required("وقت البداية"))
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage(messages.mustBeTime("وقت البداية")),

  body("schedule.duration")
    .notEmpty()
    .withMessage(messages.required("المدة"))
    .isInt({ min: 1 })
    .withMessage(messages.mustBePositiveInt("المدة")),

  body("curriculum")
    .notEmpty()
    .withMessage(messages.required("المنهج"))
    .isIn(["quran_memorization", "tajweed", "arabic", "islamic_studies"])
    .withMessage(
      messages.invalidEnum("المنهج", [
        "quran_memorization",
        "tajweed",
        "arabic",
        "islamic_studies",
      ])
    ),

  // Conditional validation for group halaka
  body("maxStudents")
    .if(body("halqaType").equals("halqa"))
    .notEmpty()
    .withMessage(messages.required("الحد الأقصى للطلاب"))
    .isInt({ min: 1 })
    .withMessage(messages.mustBePositiveInt("الحد الأقصى للطلاب")),

  // Conditional validation for private halaka
  body("userId")
    .if(body("halqaType").equals("private"))
    .notEmpty()
    .withMessage(messages.required("معرّف المستخدم"))
    .isMongoId()
    .withMessage(messages.mustBeObjectId("معرّف المستخدم")),
];

export const updateHalakaValidation = [
  body("title")
    .optional()
    .isString()
    .withMessage(messages.mustBeString("العنوان"))
    .notEmpty()
    .withMessage("لا يمكن ترك العنوان فارغًا"),

  body("description")
    .optional()
    .isString()
    .withMessage(messages.mustBeString("الوصف")),

  body("schedule")
    .optional()
    .isObject()
    .withMessage(messages.mustBeObject("الجدول")),

  body("schedule.frequency")
    .optional()
    .isIn(["daily", "weekly", "biweekly"])
    .withMessage(
      messages.invalidEnum("التكرار", ["daily", "weekly", "biweekly"])
    ),

  body("schedule.days")
    .optional()
    .isArray({ min: 1 })
    .withMessage("يجب اختيار يوم واحد على الأقل في الجدول"),

  body("schedule.startTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage(messages.mustBeTime("وقت البداية")),

  body("schedule.duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage(messages.mustBePositiveInt("المدة")),

  body("schedule.startDate")
    .optional()
    .isISO8601()
    .withMessage(messages.mustBeDate("تاريخ البداية")),

  body("schedule.endDate")
    .optional()
    .isISO8601()
    .withMessage(messages.mustBeDate("تاريخ النهاية")),

  body("schedule.timezone")
    .optional()
    .isString()
    .withMessage(messages.mustBeString("المنطقة الزمنية")),

  body("curriculum")
    .optional()
    .isIn(["quran_memorization", "tajweed", "arabic", "islamic_studies"])
    .withMessage(
      messages.invalidEnum("المنهج", [
        "quran_memorization",
        "tajweed",
        "arabic",
        "islamic_studies",
      ])
    ),

  body("maxStudents")
    .optional()
    .isInt({ min: 1 })
    .withMessage(messages.mustBePositiveInt("الحد الأقصى للطلاب")),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage(messages.mustBePositiveNum("السعر")),

  body("status")
    .optional()
    .isIn(["scheduled", "active", "completed", "cancelled"])
    .withMessage(
      messages.invalidEnum("الحالة", [
        "scheduled",
        "active",
        "completed",
        "cancelled",
      ])
    ),
];

export const cancelSessionValidation = [
  body("sessionDate")
    .notEmpty()
    .withMessage(messages.required("تاريخ الجلسة"))
    .isISO8601()
    .withMessage(messages.mustBeDate("تاريخ الجلسة")),

  body("reason")
    .optional()
    .isString()
    .withMessage(messages.mustBeString("السبب"))
    .isLength({ max: 500 })
    .withMessage(messages.maxLength("السبب", 500)),
];

export const restoreSessionValidation = [
  body("sessionDate")
    .notEmpty()
    .withMessage(messages.required("تاريخ الجلسة"))
    .isISO8601()
    .withMessage(messages.mustBeDate("تاريخ الجلسة")),
];
