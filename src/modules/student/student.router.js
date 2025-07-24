import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { updateStudentProfileValidation } from './student.profile.validation.js';
import { getStudentProfile, updateStudentProfile } from './student.profile.controller.js';
import { getHalakaDetails, getMyHalakat , getStudentDashboardStats } from './student.controller.js';

const router = Router();

// جلب جميع الحلقات التي سجل فيها الطالب (بيانات مختصرة للمشاهدة السريعة)
router.get('/my-halakat', authenticate, authorize('student'), getMyHalakat);


router.get('/dashboard/stats', authenticate, authorize('student') ,getStudentDashboardStats);

// جلب تفاصيل حلقة معينة للطالب
router.get('/halaka-details/:halakaId', authenticate, authorize('student', 'teacher'), getHalakaDetails);

// جلب بروفايل الطالب
router.get('/profile', authenticate, authorize('student'), getStudentProfile);

// تحديث بروفايل الطالب
router.put('/profile', authenticate, authorize('student'), validate(updateStudentProfileValidation), updateStudentProfile);

export default router;