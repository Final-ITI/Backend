import { body } from "express-validator";

export const updateStudentProfileValidation = [
    body('birthdate').optional().isISO8601().withMessage('تاريخ الميلاد غير صالح'),
    body('guardianName').optional().isString().withMessage('اسم ولي الأمر يجب أن يكون نصاً'),
    body('guardianPhone').optional().isString().withMessage('رقم ولي الأمر غير صالح'),
    body('address').optional().isString().withMessage('العنوان يجب أن يكون نصاً'),
    body('phone').optional().isString().withMessage('رقم الهاتف غير صالح'),
    body('email').optional().isEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('fullName').optional().isString().withMessage('الاسم الكامل يجب أن يكون نصاً'),
];
