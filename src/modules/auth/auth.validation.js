import { body, param } from "express-validator";

export const registerValidation = [
  body("firstName")
    .notEmpty()
    .withMessage("الاسم الأول مطلوب.")
    .isLength({ min: 2, max: 50 })
    .withMessage("يجب أن يتراوح طول الاسم الأول بين 2 و 50 حرفًا.")
    .trim()
    .escape(),

  body("lastName")
    .notEmpty()
    .withMessage("اسم العائلة مطلوب.")
    .isLength({ min: 2, max: 50 })
    .withMessage("يجب أن يتراوح طول اسم العائلة بين 2 و 50 حرفًا.")
    .trim()
    .escape(),

  body("email")
    .isEmail()
    .withMessage("الرجاء إدخال عنوان بريد إلكتروني صالح.")
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
      "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل، وتحتوي على حرف كبير واحد على الأقل، وحرف صغير واحد، ورقم واحد، وحرف خاص واحد (#?!@$%^&*-)."
    ),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("تأكيد كلمة المرور غير متطابق.");
    }
    return true;
  }),

  body("role")
    .notEmpty()
    .isIn(["student", "teacher"])
    .withMessage("يجب أن يكون الدور 'طالب' أو 'معلم'.")
    .trim()
    .escape(),

  body("gender")
    .notEmpty()
    .isIn(["male", "female"])
    .withMessage("يجب أن يكون الجنس 'ذكر' أو 'أنثى'."),

  body("country")
    .notEmpty()
    .withMessage("الدولة مطلوبة.")
    .isLength({ min: 2, max: 50 })
    .withMessage("يجب أن يتراوح طول اسم الدولة بين 2 و 50 حرفًا.")
    .trim()
    .escape(),
];

export const activateCodeEmailValidation = [
  param("activationCodeEmail")
    .notEmpty()
    .withMessage("رمز التفعيل مطلوب.")
    .isString()
    .withMessage("يجب أن يكون رمز التفعيل سلسلة نصية.")
    .trim()
    .escape(),
];

export const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("الرجاء إدخال عنوان بريد إلكتروني صالح.")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("كلمة المرور مطلوبة."),
];




