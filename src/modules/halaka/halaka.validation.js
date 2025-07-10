import { body } from "express-validator";

export const createHalakaValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string"),

  body("halqaType")
    .notEmpty()
    .withMessage("halqaType is required")
    .isIn(["private", "halqa"])
    .withMessage("halqaType must be 'private' or 'halqa'"),

  body("schedule")
    .notEmpty()
    .withMessage("Schedule is required")
    .isObject()
    .withMessage("Schedule must be an object"),

  body("schedule.startDate")
    .notEmpty()
    .withMessage("schedule.startDate is required")
    .isISO8601()
    .withMessage("schedule.startDate must be a valid date"),

  body("schedule.endDate")
    .notEmpty()
    .withMessage("schedule.endDate is required")
    .isISO8601()
    .withMessage("schedule.endDate must be a valid date"),

  body("schedule.days")
    .isArray({ min: 1 })
    .withMessage("At least one day is required in schedule.days"),

  body("schedule.startTime")
    .notEmpty()
    .withMessage("schedule.startTime is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("startTime must be in HH:mm format"),

  body("schedule.duration")
    .notEmpty()
    .withMessage("schedule.duration is required")
    .isInt({ min: 1 })
    .withMessage("duration must be a positive integer"),

  body("curriculum")
    .notEmpty()
    .withMessage("Curriculum is required")
    .isIn(["quran_memorization", "tajweed", "arabic", "islamic_studies"])
    .withMessage("Invalid curriculum type"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  // Conditional validation for group halaka
  body("maxStudents")
    .if(body("halqaType").equals("halqa"))
    .notEmpty()
    .withMessage("maxStudents is required for group halaka")
    .isInt({ min: 1 })
    .withMessage("maxStudents must be a positive integer"),

  // Conditional validation for private halaka
  body("student")
    .if(body("halqaType").equals("private"))
    .notEmpty()
    .withMessage("student is required for private halaka")
    .isMongoId()
    .withMessage("student must be a valid ObjectId"),
];

export const updateHalakaValidation = [
  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .notEmpty()
    .withMessage("Title cannot be empty"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  body("schedule")
    .optional()
    .isObject()
    .withMessage("Schedule must be an object"),

  body("schedule.frequency")
    .optional()
    .isIn(["daily", "weekly", "biweekly"])
    .withMessage("Invalid frequency"),

  body("schedule.days")
    .optional()
    .isArray({ min: 1 })
    .withMessage("At least one day is required in schedule.days"),

  body("schedule.startTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("startTime must be in HH:mm format"),

  body("schedule.duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage("duration must be a positive integer"),

  body("schedule.startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid date"),

  body("schedule.endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be a valid date"),

  body("schedule.timezone")
    .optional()
    .isString()
    .withMessage("timezone must be a string"),

  body("curriculum")
    .optional()
    .isIn(["quran_memorization", "tajweed", "arabic", "islamic_studies"])
    .withMessage("Invalid curriculum type"),

  body("maxStudents")
    .optional()
    .isInt({ min: 1 })
    .withMessage("maxStudents must be a positive integer"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("status")
    .optional()
    .isIn(["scheduled", "active", "completed", "cancelled"])
    .withMessage("Invalid status"),
];
