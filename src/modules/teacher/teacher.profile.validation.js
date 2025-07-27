
import { body } from 'express-validator';

export const updateProfileValidation = [
  body('bio').optional().isString().isLength({ max: 500 }).withMessage('السيرة الذاتية يجب ألا تتجاوز 500 حرف'),
  body('experience').optional().isInt({ min: 0, max: 50 }).withMessage('سنوات الخبرة يجب أن تكون بين 0 و 50'),
  body('specialization').optional().isArray().withMessage('التخصص يجب أن يكون مصفوفة'),
  body('specialization.*').optional().isString().withMessage('كل تخصص يجب أن يكون نصاً'),
  body('address').optional().isString().withMessage('العنوان يجب أن يكون نصاً'),
  body('phone').optional().isString().withMessage('رقم الهاتف غير صالح'),
  body('email').optional().isEmail().withMessage('البريد الإلكتروني غير صالح'),
  body('fullName').optional().isString().withMessage('الاسم الكامل يجب أن يكون نصاً'),
  body('birthdate').optional().isISO8601().withMessage('تاريخ الميلاد غير صالح'),
  body('highestDegree').optional().isString().withMessage('أعلى مؤهل يجب أن يكون نصاً'),
];

export const uploadDocumentValidation = [
  body('docType')
    .optional()
    .custom((value, { req }) => {
      if (req.file && !value) {
        throw new Error('نوع الوثيقة مطلوب عند تحميل ملف.');
      }
      return true;
    })
    .isIn([
      "national_id_front",
      "national_id_back",
      "certificates",
      "qualification_certificate",
      "student_id",
      "birth_certificate",
      "guardian_id",
      "teaching_license",
      "tajweed_certification",
      "academy_license",
      "commercial_registration",
    ])
    .withMessage("يجب أن يكون نوع المستند أحد الخيارات التالية: national_id_front, national_id_back, certificates, qualification_certificate, student_id, birth_certificate, guardian_id, teaching_license, tajweed_certification, academy_license, commercial_registration"),
];
