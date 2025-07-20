import { body } from 'express-validator';

export const createReview = [
    body('halakaId').isMongoId().withMessage('Valid halakaId is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('reviewText').optional().isString().trim(),
]; 