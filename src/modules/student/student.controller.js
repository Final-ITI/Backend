import Halaka, { getAllSessionDates ,calculateEndTime } from '../../../DB/models/halaka.js';
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
                zoomMeeting: halaka.zoomMeeting,
                schedule: halaka.schedule, // Add the full schedule object here
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
                select: '_id bio',
                populate: { path: 'userId', select: 'firstName lastName profileImage' }
            })
            .populate('chatGroup');

        if (!halaka) {
            return notFound(res, 'الحلقة غير موجودة أو أنك لست مسجلاً فيها');
        }

        const teacher = halaka.teacher;
        const user = teacher?.userId;

        // Get all session dates, considering total sessions and cancelled ones to show full history
        const totalSessionsConsidered = (halaka.totalSessions || 0) + (halaka.cancelledSessions?.length || 0);
        const allSessionDates = getAllSessionDates(halaka.schedule, totalSessionsConsidered);

        const myProgress = allSessionDates.map((date, index) => {
            const attendanceEntry = halaka.attendance.find(
                (att) => att.sessionDate.toISOString().slice(0, 10) === date.toISOString().slice(0, 10)
            );

            const myRecord = attendanceEntry?.records.find(
                (r) => r.student && r.student._id.toString() === student._id.toString()
            );

            return {
                sessionNumber: index + 1,
                sessionDate: date.toISOString().slice(0, 10),
                status: myRecord?.status || 'absent',
                score: myRecord?.score || null,
                notes: myRecord?.notes || '',
                isCancelled: halaka.isSessionCancelled(date),
            };
        });

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
                id: user?._id, // Changed to return the User's _id here
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
            chatGroup: halaka.chatGroup, // Already added, keeping it
            myProgress, // Add student's personal progress here
        };

        return success(res, result, 'تم جلب تفاصيل الحلقة بنجاح');
    } catch (err) {
        console.error('Get Halaka Details Error:', err);
        return error(res, 'حدث خطأ أثناء جلب تفاصيل الحلقة', 500, err);
    }
};

// إحصائيات لوحة الطالب
export const getStudentDashboardStats = async (req, res) => {
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

        const halakat = await Halaka.find(filter).populate('teacher');

        // Total halakat enrolled
        const totalHalakat = halakat.length;

        // Halakat scheduled for today
        const today = new Date();
        const todayDay = today.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
        const halakatToday = halakat.filter(h =>
            h.schedule?.days?.includes(todayDay)
        ).length;

        // Unique teachers
        const teacherIds = new Set(halakat.map(h => String(h.teacher?._id)));
        const totalTeachers = teacherIds.size;

        // Study hours this week
        let weekHours = 0;
        halakat.forEach(h => {
            if (!h.schedule) return;
            let freq = h.schedule.frequency || "weekly";
            let daysPerWeek = h.schedule.days?.length || 0;
            let weeklyMultiplier =
                freq === "daily" ? 7 : freq === "biweekly" ? 0.5 : 1;
            weekHours +=
                (daysPerWeek * (h.schedule.duration || 0) * weeklyMultiplier) / 60;
        });

        return success(
            res,
            {
                totalHalakat,
                halakatToday,
                totalTeachers,
                weekHours: Math.round(weekHours * 10) / 10,
            },
            'تم جلب إحصائيات لوحة الطالب بنجاح'
        );
    } catch (err) {
        console.error('Student Dashboard Stats Error:', err);
        return error(res, 'حدث خطأ أثناء جلب إحصائيات لوحة الطالب', 500, err);
    }
};

// جلب الحلقات المجدولة اليوم للطالب
export const getTodayHalakatForStudent = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return error(res, "لم يتم العثور على الطالب", 403);

        const now = new Date();
        const todayName = now
            .toLocaleString("en-US", { weekday: "long" })
            .toLowerCase();
        const todayUtc = new Date();
        todayUtc.setUTCHours(0, 0, 0, 0);

        // Find halakat where the student is enrolled and scheduled for today
        const filter = {
            $and: [
                {
                    $or: [
                        { student: student._id },
                        { students: student._id },
                        { enrolledStudents: student._id }
                    ]
                },
                { "schedule.days": todayName },
                { "schedule.startDate": { $lte: todayUtc } },
                { "schedule.endDate": { $gte: todayUtc } }
            ]
        };

        const halakat = await Halaka.find(filter).populate('teacher');

        const mapped = halakat.map((h) => {
            const endTime = calculateEndTime(
                h.schedule.startTime,
                h.schedule.duration
            );

            let numberOfStudents = 0;
            if (h.halqaType === "halqa") {
                numberOfStudents = Array.isArray(h.students)
                    ? h.students.length
                    : h.currentStudents || 0;
            } else if (h.halqaType === "private") {
                numberOfStudents = h.student ? 1 : 0;
            }

            return {
                title: h.title,
                startTime: h.schedule.startTime,
                endTime,
                numberOfStudents,
                zoomMeeting: h.zoomMeeting || {},
            };
        });

        return success(res, mapped, "تم جلب الحلقات المجدولة اليوم بنجاح");
    } catch (err) {
        console.error(err);
        return error(res, "فشل في جلب الحلقات المجدولة اليوم", 500, err);
    }
};
