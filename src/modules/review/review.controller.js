import { created, error, validationError, success, notFound } from '../../utils/apiResponse.js';
import Review from '../../../DB/models/review.js';
import Student from '../../../DB/models/student.js';
import Halaka from '../../../DB/models/halaka.js';
import Teacher from '../../../DB/models/teacher.js';

// Create a new review for a finished halaka
export const createReview = async (req, res) => {
    try {
        const { halakaId, rating, reviewText } = req.body;
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return error(res, 'الطالب غير موجود', 404);
        const halaka = await Halaka.findById(halakaId);
        if (!halaka) return notFound(res, 'الحلقة غير موجودة');
        // Check if the student is enrolled in this halaka (private or group)
        const isStudentEnrolled = halaka.student && halaka.student.equals(student._id);
        const isStudentInGroupHalaka = halaka.halqaType === 'halqa' && halaka.currentStudents > 0;
        if (!isStudentEnrolled && !isStudentInGroupHalaka) {
            return error(res, 'أنت لست مسجلاً في هذه الحلقة', 403);
        }
        // Check if the halaka is finished
        const now = new Date();
        const isHalakaFinished = halaka.schedule.endDate && new Date(halaka.schedule.endDate) < now;
        if (!isHalakaFinished) {
            return error(res, 'لم تنتهِ الحلقة بعد', 400);
        }
        // Check if the student has already reviewed this halaka
        const existingReview = await Review.findOne({ student: student._id, halaka: halakaId });
        if (existingReview) {
            return error(res, 'لقد قمت بتقييم هذه الحلقة مسبقاً', 409);
        }
        // Get the teacher from the halaka
        const teacher = await Teacher.findById(halaka.teacher);
        if (!teacher) return error(res, 'المعلم غير موجود لهذه الحلقة', 404);
        const newReview = new Review({
            student: student._id,
            teacher: teacher._id,
            halaka: halakaId,
            rating,
            reviewText,
        });
        await newReview.save();
        return created(res, newReview, 'تم إرسال التقييم بنجاح');
    } catch (err) {
        console.error('Create Review Error:', err);
        if (err.code === 11000) {
            return error(res, 'لقد قمت بتقييم هذه الحلقة مسبقاً.', 409);
        }
        return error(res, 'خطأ في الخادم', 500, err);
    }
};

// Get reviews for a specific teacher
export const getTeacherReviews = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) return notFound(res, 'المعلم غير موجود');
        const reviews = await Review.find({ teacher: teacherId })
            .populate({
                path: 'student',
                populate: {
                    path: 'userId',
                    select: 'firstName lastName profileImage',
                },
            })
            .sort({ createdAt: -1 });
        const formattedReviews = reviews.map(review => ({
            id: review._id,
            rating: review.rating,
            reviewText: review.reviewText,
            createdAt: review.createdAt,
            student: {
                id: review.student._id,
                firstName: review.student.userId?.firstName,
                lastName: review.student.userId?.lastName,
                profileImage: review.student.userId?.profileImage,
            },
        }));
        return success(res, formattedReviews, 'تم جلب تقييمات المعلم بنجاح');
    } catch (err) {
        console.error('Get Teacher Reviews Error:', err);
        return error(res, 'خطأ في الخادم', 500, err);
    }
}; 