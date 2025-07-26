import { body } from 'express-validator';

export const createReview = [
    body('halakaId').isMongoId().withMessage('معرف الحلقة صالح مطلوب'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('يجب أن يكون التقييم من 1 إلى 5'),
    body('reviewText').optional().isString().trim(),
]; 