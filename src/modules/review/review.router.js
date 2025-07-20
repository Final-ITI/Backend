import { Router } from 'express';
import * as reviewController from './review.controller.js';
import  { authenticate , authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import * as reviewValidation from './review.validation.js';

const router = Router();

// Route to create a new review (student only)
router.post(
    '/',
    authenticate,
    // authorize(['student']),
    validate(reviewValidation.createReview),
    reviewController.createReview
);

// Route to get reviews for a specific teacher
router.get(
    '/:teacherId',
    reviewController.getTeacherReviews
);

export default router; 