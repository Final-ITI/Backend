import { Router } from 'express';
import { authenticate , authorize } from '../../middlewares/auth.middleware.js';
import * as studentController from './student.controller.js';

const router = Router();

// جلب جميع الحلقات التي سجل فيها الطالب (بيانات مختصرة للمشاهدة السريعة)
router.get('/my-halakat', authenticate, authorize('student'), studentController.getMyHalakat);

// جلب تفاصيل حلقة معينة للطالب
router.get('/halaka-details/:halakaId', authenticate, authorize('student', 'teacher'), studentController.getHalakaDetails);

export default router; 