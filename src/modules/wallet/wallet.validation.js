import { body, query, param } from "express-validator";

export const createPayoutRequestValidation = [
  body("amount")
    .notEmpty()
    .withMessage("المبلغ مطلوب")
    .isFloat({ min: 200 })
    .withMessage("الحد الأدنى لمبلغ السحب هو 200 جنيه مصري"),
];

export const updateBankingInfoValidation = [
  body("bankName")
    .notEmpty()
    .withMessage("اسم البنك مطلوب")
    .isLength({ min: 2, max: 100 })
    .withMessage("اسم البنك يجب أن يكون بين 2 و 100 حرف")
    .matches(/^[a-zA-Z\u0600-\u06FF\s\-\.]+$/)
    .withMessage("اسم البنك يحتوي على أحرف غير صالحة"),

  body("accountHolderName")
    .notEmpty()
    .withMessage("اسم صاحب الحساب مطلوب")
    .isLength({ min: 2, max: 100 })
    .withMessage("اسم صاحب الحساب يجب أن يكون بين 2 و 100 حرف")
    .matches(/^[a-zA-Z\u0600-\u06FF\s\-\.]+$/)
    .withMessage("اسم صاحب الحساب يحتوي على أحرف غير صالحة"),

  body("accountNumber")
    .notEmpty()
    .withMessage("رقم الحساب مطلوب")
    .isLength({ min: 16, max: 16 })
    .withMessage("رقم الحساب يجب أن يكون 16 رقم بالضبط")
    .matches(/^[0-9]{16}$/)
    .withMessage("رقم الحساب يجب أن يحتوي على 16 رقم فقط"),

  body("iban")
    .optional()
    .custom((value) => {
      if (value && value.trim() !== "") {
        // IBAN validation: should start with 2 letters followed by 2 digits, then up to 30 alphanumeric characters
        const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
        if (!ibanRegex.test(value.replace(/\s/g, "").toUpperCase())) {
          throw new Error("رقم IBAN غير صالح");
        }
      }
      return true;
    }),

  body("swiftCode")
    .optional()
    .custom((value) => {
      if (value && value.trim() !== "") {
        // SWIFT code validation: 8 or 11 characters, letters and numbers
        const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
        if (!swiftRegex.test(value.toUpperCase())) {
          throw new Error("رمز SWIFT غير صالح - يجب أن يكون 8 أو 11 حرف");
        }
      }
      return true;
    }),
];

export const getPayoutRequestsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("رقم الصفحة يجب أن يكون رقم موجب"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("عدد العناصر يجب أن يكون بين 1 و 100"),
  query("status")
    .optional()
    .isIn(["pending", "approved", "rejected", "completed"])
    .withMessage("حالة الطلب غير صحيحة"),
];

// Admin validation for getting all payout requests
export const getAllPayoutRequestsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("رقم الصفحة يجب أن يكون رقم موجب"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("عدد العناصر يجب أن يكون بين 1 و 100"),
  query("status")
    .optional()
    .isIn(["pending", "approved", "rejected", "completed"])
    .withMessage("حالة الطلب غير صحيحة"),
];

// Admin validation for updating payout request status
export const updatePayoutRequestStatusValidation = [
  param("id").isMongoId().withMessage("معرف طلب السحب غير صالح"),
  body("action")
    .notEmpty()
    .withMessage("حالة الطلب مطلوبة")
    .isIn(["approved", "rejected", "completed"])
    .withMessage("حالة الطلب يجب أن تكون: approved أو rejected أو completed"),
  body("adminNotes")
    .optional()
    .isString()
    .withMessage("ملاحظات الإدارة يجب أن تكون نص")
    .isLength({ max: 500 })
    .withMessage("ملاحظات الإدارة يجب ألا تتجاوز 500 حرف"),
  body("rejectionReason")
    .if(body("status").equals("rejected"))
    .notEmpty()
    .withMessage("سبب الرفض مطلوب عند رفض الطلب")
    .isString()
    .withMessage("سبب الرفض يجب أن يكون نص")
    .isLength({ min: 10, max: 200 })
    .withMessage("سبب الرفض يجب أن يكون بين 10 و 200 حرف"),
  //   body("completedAt")
  //     .if(body("status").equals("completed"))
  //     .optional()
  //     .isISO8601()
  //     .withMessage("تاريخ الإنجاز غير صالح - يجب أن يكون بصيغة ISO 8601"),
];
