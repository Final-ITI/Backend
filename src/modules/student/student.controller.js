import Halaka, { getAllSessionDates } from '../../../DB/models/halaka.js';
import Student from '../../../DB/models/student.js';
import Teacher from '../../../DB/models/teacher.js';
import User from '../../../DB/models/user.js';
import { success, error, notFound, paginated } from '../../utils/apiResponse.js';

// جلب جميع الحلقات التي سجل فيها الطالب (بيانات مختصرة للمشاهدة السريعة)
export const getMyHalakat = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) {
            return error(res, 'الطالب غير موجود', 404);
        }

        const filter = {
            $or: [
                { student: student._id },
                { students: student._id },
                { 'enrolledStudents': student._id },
            ]
        };

        // Pagination
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalItems = await Halaka.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / limit);

        const halakat = await Halaka.find(filter)
            .populate({
                path: 'teacher',
                populate: { path: 'userId', select: 'firstName lastName profileImage' }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        if (!halakat.length) {
            return success(res, [], 'لا توجد حلقات مسجل بها الطالب حالياً');
        }

        const result = await Promise.all(halakat.map(async (halaka) => {
            const teacher = halaka.teacher;
            const user = teacher?.userId;

            const firstUpcomingSession = halaka.getUpcomingSessions ? (await halaka.getUpcomingSessions(1))[0] : null;

            return {
                id: halaka._id,
                title: halaka.title,
                description: halaka.description || '',
                teacher: {
                    name: user ? `أ. ${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'غير متوفر',
                    profileImage: user?.profileImage ?? '/default-profile.jpg',
                },
                curriculum: halaka.curriculum,
                status: halaka.status,
                halqaType: halaka.halqaType,
                zoomJoinUrl: halaka.zoomMeeting?.joinUrl,
                firstUpcomingSession: firstUpcomingSession ? {
                    scheduledDate: firstUpcomingSession.scheduledDate,
                    scheduledStartTime: firstUpcomingSession.scheduledStartTime,
                    scheduledEndTime: firstUpcomingSession.scheduledEndTime,
                } : null,
            };
        }));

        const paginationInfo = {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };

        return paginated(res, result, paginationInfo, 'تم جلب الحلقات بنجاح');
    } catch (err) {
        console.error('Get My Halakat Error:', err);
        return error(res, 'حدث خطأ أثناء جلب الحلقات', 500, err);
    }
};

// جلب تفاصيل حلقة معينة للطالب (جميع البيانات المطلوبة للمشاهد المفصلة)
export const getHalakaDetails = async (req, res) => {
    try {
        const { halakaId } = req.params;
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) {
            return error(res, 'الطالب غير موجود', 404);
        }

        const halaka = await Halaka.findOne({
            _id: halakaId,
            $or: [
                { student: student._id },
                { students: student._id },
                { 'enrolledStudents': student._id },
            ]
        })
            .populate({
                path: 'teacher',
                populate: { path: 'userId', select: 'firstName lastName profileImage bio' }
            })
            .populate('chatGroup');

        if (!halaka) {
            return notFound(res, 'الحلقة غير موجودة أو أنك لست مسجلاً فيها');
        }

        const teacher = halaka.teacher;
        const user = teacher?.userId;

        const allSessionDates = getAllSessionDates(halaka.schedule, halaka.totalSessions || 0);

        const attendance = (halaka.attendance || []).map(a => {
            const record = a.records.find(r => r.student?.toString() === student._id.toString());
            return {
                sessionDate: a.sessionDate,
                status: record ? record.status : 'absent',
                timeIn: record ? record.timeIn : null,
                timeOut: record ? record.timeOut : null,
            };
        });

        const finishedSessions = attendance.filter(a => ['present', 'late', 'excused'].includes(a.status)).length;

        const upcomingSessions = halaka.getUpcomingSessions ? halaka.getUpcomingSessions(5) : [];

        const result = {
            id: halaka._id,
            title: halaka.title,
            description: halaka.description || '',
            teacher: {
                name: user ? `أ. ${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'غير متوفر',
                profileImage: user?.profileImage ?? '/default-profile.jpg',
                rating: teacher?.performance?.rating ?? 0,
                bio: teacher?.bio ?? '',
            },
            curriculum: halaka.curriculum,
            maxStudents: halaka.maxStudents,
            currentStudents: halaka.currentStudents,
            schedule: halaka.schedule,
            status: halaka.status,
            halqaType: halaka.halqaType,
            allSessionDates,
            attendance,
            finishedSessions,
            upcomingSessions,
            zoomMeeting: halaka.zoomMeeting,
            chatGroup: halaka.chatGroup, 
        };

        return success(res, result, 'تم جلب تفاصيل الحلقة بنجاح');
    } catch (err) {
        console.error('Get Halaka Details Error:', err);
        return error(res, 'حدث خطأ أثناء جلب تفاصيل الحلقة', 500, err);
    }
}; 