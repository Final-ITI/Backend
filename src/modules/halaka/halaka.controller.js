import Halaka, { getAllSessionDates } from "../../../DB/models/halaka.js";
import {
  created,
  error,
  validationError,
  success,
  notFound,
} from "../../utils/apiResponse.js";
import Teacher from "../../../DB/models/teacher.js";
import Session from "../../../DB/models/session.js";
import { paginated } from "../../utils/apiResponse.js";
import User from "../../../DB/models/user.js";
import Student from "../../../DB/models/student.js";
import Enrollment from "../../../DB/models/enrollment.js";

//teacher

/* -------------------------------------------------- *
 *  Halaka cruds                                     *
 * -------------------------------------------------- */
// Create a new Halaka
export const createHalaka = async (req, res) => {
  try {
    const {
      title,
      description,
      halqaType,
      student: userId,
      schedule,
      curriculum,
      maxStudents,
      price,
    } = req.body;


    // Basic validation first
    if (!title || !halqaType || !schedule || !curriculum) {
      return validationError(res, [
        "الحقول المطلوبة مفقودة: العنوان، نوع الحلقة، الجدول، المنهج",
      ]);
    }

    // Get teacher BEFORE validation that uses teacher data
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "لم يتم العثور على المعلم", 403);
    }

    // Now you can safely validate using teacher data
    if (halqaType === "private" && !teacher.sessionPrice) {
      return validationError(res, ["المعلم لا يملك سعر جلسة محدد"]);
    }

    let studentDoc = null;
    if (halqaType === "private") {
      if (!userId) {
        return validationError(res, [
          "userId الخاص بالطالب مطلوب للحلقة الخاصة",
        ]);
      }
      // Find the student by userId (userId is from req.body)
      studentDoc = await Student.findOne({ userId });
      if (!studentDoc) {
        return validationError(res, ["لم يتم العثور على طالب بهذا userId"]);
      }
    }

    if (halqaType === "halqa" && !maxStudents) {
      return validationError(res, ["الحد الأقصى للطلاب مطلوب للحلقة الجماعية"]);
    }

    const halakaData = {
      title,
      description,
      teacher: teacher._id,
      halqaType,
      schedule,
      curriculum,
      status: "scheduled",
    };

    if (halqaType === "private") {
      halakaData.student = studentDoc._id;
      halakaData.maxStudents = 1;
      halakaData.currentStudents = 1;
      halakaData.price = Number(teacher.sessionPrice);
    } else {
      halakaData.maxStudents = maxStudents;
      halakaData.currentStudents = 0;
      halakaData.price = price;
    }

    // Save Halaka
    let halaka = new Halaka(halakaData);
    await halaka.save();

    // For group halaka, create a ChatGroup and assign it
    if (halqaType === "halqa") {
      // Get the teacher's userId
      const teacherDoc = await Teacher.findById(teacher._id).populate("userId");
      let teacherUserId = null;
      if (teacherDoc && teacherDoc.userId) {
        teacherUserId = teacherDoc.userId._id;
      }

      if (teacherUserId) {
        const ChatGroup = (await import("../../../DB/models/chatGroup.js"))
          .default;
        const chatGroup = await ChatGroup.create({
          halaka: halaka._id,
          participants: [teacherUserId],
          messages: [],
        });
        halaka.chatGroup = chatGroup._id;
        await halaka.save();
      }
    }

    return created(res, halaka, "تم إنشاء الحلقة بنجاح");
  } catch (err) {
    console.error("❌ خطأ في إنشاء الحلقة:", err);
    return error(res, "خطأ في الخادم", 500, err);
  }
};

//update Halaka
export const updateHalaka = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "لم يتم العثور على المعلم", 403);
    }

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka) return notFound(res, "لم يتم العثور على الحلقة");

    const allowedFields = [
      "title",
      "description",
      "schedule",
      "curriculum",
      "maxStudents",
      "price",
      "status",
    ];

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) halaka[key] = req.body[key];
    }

    if (halaka.halqaType === "private") {
      halaka.price = Number(teacher.sessionPrice);
    }

    await halaka.save();

    return success(res, halaka, "تم تحديث الحلقة بنجاح");
  } catch (err) {
    return error(res, "فشل في تحديث الحلقة", 500, err);
  }
};
// Get a Halaka by ID
export const getHalakaById = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "لم يتم العثور على المعلم", 403);
    }

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka)
      return notFound(res, "لم يتم العثور على الحلقة أو أنها ليست ملكك");

    return success(res, halaka, "تم جلب بيانات الحلقة بنجاح");
  } catch (err) {
    return error(res, "فشل في جلب بيانات الحلقة", 500, err);
  }
};

// Delete a Halaka
export const deleteHalaka = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "لم يتم العثور على المعلم", 403);
    }

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka)
      return notFound(res, "لم يتم العثور على الحلقة أو أنها ليست ملكك");

    await Session.deleteMany({ halaka: halaka._id });
    await Teacher.findByIdAndUpdate(halaka.teacher, {
      $pull: { halakat: halaka._id },
    });
    await halaka.deleteOne();

    return success(
      res,
      null,
      "تم حذف الحلقة وجميع البيانات المتعلقة بها بنجاح"
    );
  } catch (err) {
    return error(res, "فشل في حذف الحلقة", 500, err);
  }
};

// Get all Halakat for the logged-in teacher
export const getHalakatByTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "لم يتم العثور على المعلم", 403);
    }

    const halakat = await Halaka.find({ teacher: teacher._id }).sort({
      createdAt: -1,
    });

    return success(res, halakat, "تم جلب الحلقات بنجاح");
  } catch (err) {
    return error(res, "فشل في جلب الحلقات", 500, err);
  }
};

// Get students enrolled in a specific Halaka
export const getHalakaStudents = async (req, res) => {
  try {
    const halaka = await Halaka.findById(req.params.id)
      .populate({
        path: "students",
        populate: {
          path: "userId",
          select: "firstName lastName email _id profilePicture",
        },
      })
      .populate({
        path: "student",
        populate: {
          path: "userId",
          select: "firstName lastName email _id profilePicture",
        },
      });

    if (!halaka) return notFound(res, "لم يتم العثور على الحلقة");

    let studentsList = [];
    if (halaka.halqaType === "halqa") {
      studentsList = (halaka.students || [])
        .map((stu) => {
          return stu.userId
            ? {
                id: stu._id,
                firstName: stu.userId.firstName,
                lastName: stu.userId.lastName,
                email: stu.userId.email,
                profilePicture:
                  stu.userId.profilePicture || "/default-profile.jpg",
              }
            : null;
        })
        .filter(Boolean);
    } else if (
      halaka.halqaType === "private" &&
      halaka.student &&
      halaka.student.userId
    ) {
      studentsList = [
        {
          id: halaka.student._id,
          firstName: halaka.student.userId.firstName,
          lastName: halaka.student.userId.lastName,
          email: halaka.student.userId.email,
          profilePicture:
            halaka.student.userId.profilePicture || "/default-profile.jpg",
        },
      ];
    }

    return success(res, studentsList, "تم جلب طلاب الحلقة بنجاح");
  } catch (err) {
    return error(res, "فشل في جلب طلاب الحلقة", 500, err);
  }
};

//get all public halakat in system

function getNextSessionText(schedule) {
  const dayNames = {
    sunday: "الأحد",
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
  };
  // Show next occurring day in user's schedule
  if (schedule.days && schedule.days.length > 0) {
    const nextDay = schedule.days[0];
    const arabicDay = dayNames[nextDay] || nextDay;
    return `${arabicDay} - ${schedule.startTime}`;
  }
  return "غير محدد";
}

export const getAllHalakat = async (req, res) => {
  try {
    const filter = {};
    filter.halqaType = "halqa";

    if (req.query.title)
      filter.title = { $regex: req.query.title, $options: "i" };
    if (req.query.curriculum) filter.curriculum = req.query.curriculum;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.teacher) filter.teacher = req.query.teacher;

    // Flexible teacher name filtering by referenced user fields
    if (req.query.teacherName) {
      const nameParts = req.query.teacherName.trim().split(/\s+/);
      let userQuery;
      if (nameParts.length === 1) {
        userQuery = {
          $or: [
            { firstName: { $regex: nameParts[0], $options: "i" } },
            { lastName: { $regex: nameParts[0], $options: "i" } },
          ],
        };
      } else {
        userQuery = {
          $or: [
            {
              firstName: { $regex: nameParts[0], $options: "i" },
              lastName: { $regex: nameParts.slice(1).join(" "), $options: "i" },
            },
            {
              firstName: {
                $regex: nameParts.slice(1).join(" "),
                $options: "i",
              },
              lastName: { $regex: nameParts[0], $options: "i" },
            },
            { firstName: { $regex: req.query.teacherName, $options: "i" } },
            { lastName: { $regex: req.query.teacherName, $options: "i" } },
          ],
        };
      }
      const users = await User.find(userQuery);
      const userIds = users.map((u) => u._id);
      const teachers = await Teacher.find({ userId: { $in: userIds } });
      filter.teacher = { $in: teachers.map((t) => t._id) };
    }

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalItems = await Halaka.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    // Populate teacher and the referenced user
    const halakat = await Halaka.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "teacher",
        populate: { path: "userId", select: "firstName lastName profileImage" },
      });

    const transformed = halakat.map((halaka) => {
      const teacher = halaka.teacher;
      const user = teacher?.userId;
      return {
        id: halaka._id.toString(),
        title: halaka.title,
        description: halaka.description || "",
        teacher: {
          name: user
            ? `أ. ${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
            : "غير متوفر",
          rating: teacher?.performance?.rating ?? 0,
          studentsCount: teacher?.performance?.totalStudents ?? 0,
          profileImage: user?.profileImage ?? "/default-profile.jpg",
        },
        curriculum: halaka.curriculum,
        price: halaka.price,
        currency: "ج.م",
        maxStudents: halaka.maxStudents,
        currentStudents: halaka.currentStudents,
        schedule: {
          days: halaka.schedule.days,
          startTime: halaka.schedule.startTime,
          duration: halaka.schedule.duration,
          frequency: halaka.schedule.frequency,
        },
        nextSession: getNextSessionText(halaka.schedule),
        location: "أونلاين",
        status: halaka.status,
        halqaType: halaka.halqaType,
      };
    });

    // Pagination info object
    const paginationInfo = {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return paginated(res, transformed, paginationInfo, "تم جلب الحلقات بنجاح");
  } catch (err) {
    console.log(err);
    return error(res, "فشل في جلب الحلقات", 500, err);
  }
};

export const getTeacherDashboardStats = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) return error(res, "لم يتم العثور على المعلم", 403);

    // 1. All halakat by this teacher
    const allHalakat = await Halaka.find({ teacher: teacher._id });

    // 2. Count total halakat
    const totalHalakat = allHalakat.length;

    // 3. All halaka IDs
    const halakaIds = allHalakat.map((h) => h._id);

    // 4. All enrollments for these halakat with status "active"
    const enrollments = await Enrollment.find({
      halaka: { $in: halakaIds },
      status: "active",
    }).select("student");

    // 5. Unique student IDs (group + private)
    const uniqueStudentIds = new Set(enrollments.map((e) => String(e.student)));
    // Add direct student for private halakat (if not enrolled)
    allHalakat.forEach((h) => {
      if (h.halqaType === "private" && h.student)
        uniqueStudentIds.add(String(h.student));
    });

    const numberOfStudents = uniqueStudentIds.size;

    // 6. Halakat of the current day (any halaka scheduled for today)
    const today = new Date();
    const todayDay = today
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();
    const halakatToday = allHalakat.filter((h) =>
      h.schedule.days.includes(todayDay)
    ).length;

    // 7. Teaching hours in week
    // For each halaka, if it has a day in ["sunday",..."saturday"], and frequency is weekly or more, add (number of sessions in week * duration)
    let weekHours = 0;
    allHalakat.forEach((h) => {
      let freq = h.schedule.frequency || "weekly";
      let daysPerWeek = h.schedule.days.length;
      let weeklyMultiplier =
        freq === "daily" ? 7 : freq === "biweekly" ? 0.5 : 1;
      weekHours +=
        (daysPerWeek * (h.schedule.duration || 0) * weeklyMultiplier) / 60;
    });

    return success(
      res,
      {
        totalHalakat,
        numberOfStudents,
        halakatToday,
        weekHours: Math.round(weekHours * 10) / 10, // (decimal hours, 1 place)
      },
      "تم جلب إحصائيات لوحة المعلم بنجاح"
    );
  } catch (err) {
    return error(res, "فشل في جلب إحصائيات لوحة المعلم", 500, err);
  }
};
//-----------------------------------------------------------------------------------------------------

/* -------------------------------------------------- *
 *                   Sessions
 * -------------------------------------------------- */

/* -------------------------------------------------- *
 *  Upcoming Session                                   *
 * -------------------------------------------------- */
// Get upcoming sessions for a specific Halaka
export const getUpcomingSessions = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "لم يتم العثور على المعلم", 403);
    }

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka)
      return notFound(res, "لم يتم العثور على الحلقة أو أنها ليست ملكك");

    const sessions = halaka.getUpcomingSessions(5);
    const now = new Date();

    const formattedSessions = sessions.map((session) => {
      let status = "upcoming";
      if (session.isCancelled) {
        status = "cancelled";
      } else if (session.scheduledDate < now) {
        status = "completed";
      }

      return {
        scheduledDate: session.scheduledDate,
        scheduledStartTime: session.scheduledStartTime,
        scheduledEndTime: session.scheduledEndTime,
        zoomMeeting: session.zoomMeeting,
        status: status,
      };
    });

    return success(res, formattedSessions, "تم جلب الجلسات القادمة بنجاح");
  } catch (err) {
    console.error(err);
    return error(res, "خطأ في الخادم", 500, err);
  }
};
/* -------------------------------------------------- *
 * Attendance                                        *
 * -------------------------------------------------- */
// Get attendance records for a specific Halaka
export const getHalakaAttendance = async (req, res) => {
  try {
    const halaka = await Halaka.findById(req.params.id).populate({
      path: "attendance.records.student",
      populate: {
        path: "userId",
        select: "firstName lastName email _id profilePicture",
      },
    });
    if (!halaka) return notFound(res, "لم يتم العثور على الحلقة");

    let attendance = halaka.attendance;
    if (req.query.date)
      attendance = attendance.filter(
        (a) => a.sessionDate.toISOString().slice(0, 10) === req.query.date
      );

    // Format each record for name and student ID (keep status in English)
    const formatted = attendance.map((a) => ({
      sessionDate: a.sessionDate,
      records: a.records.map((r) => {
        const stu = r.student;
        return stu && stu.userId
          ? {
              student: {
                id: stu._id,
                firstName: stu.userId.firstName,
                lastName: stu.userId.lastName,
                email: stu.userId.email,
                profilePicture:
                  stu.userId.profilePicture || "/default-profile.jpg",
              },
              status: r.status,
              timeIn: r.timeIn,
              timeOut: r.timeOut,
            }
          : null;
      }),
    }));

    return success(res, formatted, "تم جلب بيانات الحضور بنجاح");
  } catch (err) {
    return error(res, "فشل في جلب بيانات الحضور", 500, err);
  }
};
/* -------------------------------------------------- *
 * Cancel Session                                     *
 * -------------------------------------------------- */
const yyyymmdd = (d) => new Date(d).toISOString().slice(0, 10);

export const cancelSession = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) return error(res, "لم يتم العثور على المعلم", 403);

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka)
      return notFound(res, "لم يتم العثور على الحلقة أو أنها ليست ملكك");

    if (!req.body.sessionDate) return error(res, "تاريخ الجلسة مطلوب", 400);

    const reqDate = yyyymmdd(req.body.sessionDate);

    const need =
      (halaka.totalSessions || 0) + (halaka.cancelledSessions?.length || 0);
    const dates = getAllSessionDates(halaka.schedule, need);
    const match = dates.find((d) => yyyymmdd(d) === reqDate);

    if (!match)
      return error(res, "تاريخ الجلسة ليس من الجلسات المجدولة القادمة", 400);

    if (
      halaka.cancelledSessions?.some((c) => yyyymmdd(c.sessionDate) === reqDate)
    )
      return error(res, "الجلسة ملغاة مسبقاً", 400);

    halaka.cancelledSessions.push({
      sessionDate: match,
      reason: req.body.reason || "",
      cancelledBy: teacher._id,
    });

    const newNeed =
      (halaka.totalSessions || 0) + halaka.cancelledSessions.length;
    const extDates = getAllSessionDates(halaka.schedule, newNeed);
    halaka.schedule.endDate = extDates[extDates.length - 1];
    halaka.markModified("schedule");

    await halaka.save();

    return success(
      res,
      {
        cancelledSession: { sessionDate: match, reason: req.body.reason || "" },
        newEndDate: halaka.schedule.endDate,
      },
      "تم إلغاء الجلسة وتحديث الجدول بنجاح"
    );
  } catch (err) {
    console.error("خطأ في إلغاء الجلسة:", err);
    return error(res, "فشل في إلغاء الجلسة", 500, err);
  }
};

/* -------------------------------------------------- *
 * Session Analytics                                  *
 * -------------------------------------------------- */
const findOriginalEndDate = (start, daysArr, total) => {
  let cur = new Date(start),
    cnt = 0;
  while (cnt < total) {
    const d = cur.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
    if (daysArr.includes(d)) cnt++;
    if (cnt < total) cur.setDate(cur.getDate() + 1);
  }
  return cur;
};

export const getSessionAnalytics = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) return error(res, "لم يتم العثور على المعلم", 403);

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka)
      return notFound(res, "لم يتم العثور على الحلقة أو أنها ليست ملكك");

    const cancelledCnt = halaka.cancelledSessions?.length || 0;
    const fullList = getAllSessionDates(
      halaka.schedule,
      (halaka.totalSessions || 0) + cancelledCnt
    );

    const completedCnt = halaka.attendance.filter(
      (a) => yyyymmdd(a.sessionDate) <= yyyymmdd(new Date())
    ).length;

    const findOriginalEndDate = (start, daysArr, total) => {
      let cur = new Date(start),
        cnt = 0;
      while (cnt < total) {
        const d = cur
          .toLocaleString("en-US", { weekday: "long" })
          .toLowerCase();
        if (daysArr.includes(d)) cnt++;
        if (cnt < total) cur.setDate(cur.getDate() + 1);
      }
      return cur;
    };

    const analytics = {
      totalSessions: halaka.totalSessions,
      scheduledSessions: fullList.length,
      cancelledSessions: cancelledCnt,
      completedSessions: completedCnt,
      remainingSessions: fullList.length - completedCnt,
      extended: fullList.length > halaka.totalSessions,
      originalEndDate: findOriginalEndDate(
        halaka.schedule.startDate,
        halaka.schedule.days,
        halaka.totalSessions
      ),
      currentEndDate: halaka.schedule.endDate,
    };

    return success(res, analytics, "تم إنشاء تحليلات الجلسات بنجاح");
  } catch (err) {
    console.error("خطأ في التحليلات:", err);
    return error(res, "فشل في إنشاء تحليلات الجلسات", 500, err);
  }
};

/* -------------------------------------------------- *
 * Get cancelled Sessions                                     *
 * -------------------------------------------------- */
export const getCancelledSessions = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "لم يتم العثور على المعلم", 403);
    }

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    })
      .populate("cancelledSessions.cancelledBy", "userId")
      .populate({
        path: "cancelledSessions.cancelledBy",
        populate: {
          path: "userId",
          select: "firstName lastName",
        },
      });

    if (!halaka) {
      return notFound(res, "لم يتم العثور على الحلقة أو أنها ليست ملكك");
    }

    const cancelledSessions = halaka.cancelledSessions.map((cancelled) => ({
      sessionDate: cancelled.sessionDate,
      cancelledAt: cancelled.cancelledAt,
      reason: cancelled.reason,
      cancelledBy: cancelled.cancelledBy?.userId
        ? `${cancelled.cancelledBy.userId.firstName} ${cancelled.cancelledBy.userId.lastName}`
        : "غير معروف",
    }));

    const findOriginalEndDate = (start, daysArr, total) => {
      let cur = new Date(start),
        cnt = 0;
      while (cnt < total) {
        const d = cur
          .toLocaleString("en-US", { weekday: "long" })
          .toLowerCase();
        if (daysArr.includes(d)) cnt++;
        if (cnt < total) cur.setDate(cur.getDate() + 1);
      }
      return cur;
    };

    return success(
      res,
      {
        halaka: {
          id: halaka._id,
          title: halaka.title,
        },
        cancelledSessions,
        totalCancelled: cancelledSessions.length,
        originalEndDate: halaka.totalSessions
          ? findOriginalEndDate(
              halaka.schedule.startDate,
              halaka.schedule.days,
              halaka.totalSessions
            )
          : null,
        extendedEndDate: halaka.schedule.endDate,
      },
      "تم جلب الجلسات الملغاة بنجاح"
    );
  } catch (err) {
    console.error("خطأ في جلب الجلسات الملغاة:", err);
    return error(res, "فشل في جلب الجلسات الملغاة", 500, err);
  }
};

/* -------------------------------------------------- *
 * Restore cancelled Session                           *
 * -------------------------------------------------- */
export const restoreSession = async (req, res) => {
  try {
    const { sessionDate } = req.body;
    if (!sessionDate) {
      return validationError(res, ["تاريخ الجلسة مطلوب"]);
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "لم يتم العثور على المعلم", 403);
    }

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka) {
      return notFound(res, "لم يتم العثور على الحلقة أو أنها ليست ملكك");
    }

    const sessionDateObj = new Date(sessionDate);
    const cancelledIndex = halaka.cancelledSessions.findIndex(
      (cancelled) =>
        cancelled.sessionDate.toISOString().slice(0, 10) ===
        sessionDateObj.toISOString().slice(0, 10)
    );

    if (cancelledIndex === -1) {
      return error(res, "الجلسة لم تكن ملغاة", 400);
    }

    halaka.cancelledSessions.splice(cancelledIndex, 1);
    const newEndDate = halaka.calculateExtendedEndDate();
    halaka.schedule.endDate = newEndDate;

    await halaka.save();

    return success(
      res,
      {
        halaka: halaka._id,
        restoredSessionDate: sessionDate,
        newEndDate: newEndDate,
        cancelledSessionsCount: halaka.cancelledSessions.length,
      },
      "تم استعادة الجلسة بنجاح"
    );
  } catch (err) {
    console.error("خطأ في استعادة الجلسة:", err);
    return error(res, "فشل في استعادة الجلسة", 500, err);
  }
};

export const getHalakaEnums = (req, res) => {
  return success(
    res,
    {
      halqaType: {
        halqa: "halqa",
        private: "private",
      },
      status: {
        scheduled: "scheduled",
        active: "active",
        completed: "completed",
        cancelled: "cancelled",
      },
      curriculum: {
        quran_memorization: "quran_memorization",
        tajweed: "tajweed",
        arabic: "arabic",
        islamic_studies: "islamic_studies",
      },
      sessionStatus: {
        present: "present",
        absent: "absent",
        late: "late",
        excused: "excused",
      },
      days: {
        sunday: "sunday",
        monday: "monday",
        tuesday: "tuesday",
        wednesday: "wednesday",
        thursday: "thursday",
        friday: "friday",
        saturday: "saturday",
      },
    },
    "تم جلب الخيارات المتاحة بنجاح"
  );
};

/* -------------------------------------------------- *
 * Halaka Progress (New section)                      *
 * -------------------------------------------------- */
export const getHalakaProgress = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "لم يتم العثور على المعلم", 403);
    }
    // let halakaId = req.params.id;
    // console.log("Debugging updateHalakaProgress:");
    // console.log("req.params.halakaId:", halakaId);
    // console.log("req.user._id (from auth token):", req.user._id);
    // console.log("teacher._id (found from user ID):", teacher._id);


    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    })
      .populate({
        path: "students",
        populate: {
          path: "userId",
          select: "firstName lastName _id",
        },
      })
      .populate({
        path: "student", // For private halakas
        populate: {
          path: "userId",
          select: "firstName lastName _id",
        },
      })
      .populate({
        path: "attendance.records.student",
        populate: {
          path: "userId",
          select: "firstName lastName _id",
        },
      });

    if (!halaka) {
      return notFound(res, "لم يتم العثور على الحلقة أو أنها ليست ملكك");
    }

    const allStudents = [];
    if (halaka.halqaType === "halqa" && halaka.students) {
      halaka.students.forEach((s) => {
        if (s && s.userId) {
          allStudents.push({
            id: s._id,
            userId: s.userId._id,
            firstName: s.userId.firstName,
            lastName: s.userId.lastName,
            fullName: `${s.userId.firstName} ${s.userId.lastName}`,
          });
        }
      });
    } else if (halaka.halqaType === "private" && halaka.student) {
      if (halaka.student && halaka.student.userId) {
        allStudents.push({
          id: halaka.student._id,
          userId: halaka.student.userId._id,
          firstName: halaka.student.userId.firstName,
          lastName: halaka.student.userId.lastName,
          fullName: `${halaka.student.userId.firstName} ${halaka.student.userId.lastName}`,
        });
      }
    }

    const totalSessions = halaka.totalSessions || 0;
    const cancelledCount = halaka.cancelledSessions?.length || 0;
    const allSessionDates = getAllSessionDates(
      halaka.schedule,
      totalSessions + cancelledCount
    );

    const sessionsData = allSessionDates.map((date, index) => {
      const attendanceEntry = halaka.attendance.find(
        (att) => att.sessionDate.toISOString().slice(0, 10) === date.toISOString().slice(0, 10)
      );
      return {
        sessionNumber: index + 1,
        sessionDate: date.toISOString().slice(0, 10),
        attendanceId: attendanceEntry ? attendanceEntry._id : null, // ID for the attendance document
      };
    });

    const studentProgress = allStudents.map((student) => {
      const studentSessionData = sessionsData.map((session) => {
        const attendanceEntryForSession = halaka.attendance.find(
          (att) => att.sessionDate.toISOString().slice(0, 10) === session.sessionDate
        );

        const attendanceRecord = attendanceEntryForSession?.records.find(
          (r) => r.student && r.student._id.toString() === student.id.toString()
        );

        return {
          sessionNumber: session.sessionNumber,
          sessionDate: session.sessionDate,
          status: attendanceRecord?.status || "absent",
          score: attendanceRecord?.score || null, // Changed default to null for clarity if no score
          notes: attendanceRecord?.notes || "",
        };
      });

      return {
        studentId: student.id,
        fullName: student.fullName,
        progress: studentSessionData,
      };
    });

    return success(res, { halakaId: halaka._id, studentProgress, sessionsData }, "تم جلب تقدم الطلاب بنجاح");
  } catch (err) {
    console.error("خطأ في جلب تقدم الطلاب:", err);
    return error(res, "فشل في جلب تقدم الطلاب", 500, err);
  }
};

export const updateHalakaProgress = async (req, res) => {
  try {
    const halakaId = req.params.id;
    const { studentId, sessionDate, score, notes } = req.body;

    if (!studentId || !sessionDate) {
      return validationError(res, ["معرف الطالب وتاريخ الجلسة مطلوبان"]);
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "لم يتم العثور على المعلم", 403);
    }

   


    const halaka = await Halaka.findOne({
      _id: halakaId,
      teacher: teacher._id,
    });

    if (!halaka) {
      return notFound(res, "لم يتم العثور على الحلقة أو أنها ليست ملكك");
    }

    const sessionDateObj = new Date(sessionDate);
    let attendanceEntry = halaka.attendance.find(
      (att) => att.sessionDate.toISOString().slice(0, 10) === sessionDateObj.toISOString().slice(0, 10)
    );

    if (!attendanceEntry) {
      attendanceEntry = {
        sessionDate: sessionDateObj,
        records: [],
      };
      halaka.attendance.push(attendanceEntry);
    }

    let studentRecord = attendanceEntry.records.find(
      (rec) => rec.student.toString() === studentId
    );

    if (studentRecord) {
      // Update existing record
      if (score !== undefined) studentRecord.score = score;
      if (notes !== undefined) studentRecord.notes = notes;
    } else {
      // Create new record
      attendanceEntry.records.push({
        student: studentId,
        score: score || null,
        notes: notes || "",
        status: "absent", // Default status as it won't be sent from frontend for now
      });
    }

    halaka.markModified('attendance'); // Mark attendance array as modified
    await halaka.save();

    return success(
      res,
      { halakaId, studentId, sessionDate, score, notes }, // Removed status from response
      "تم تحديث تقدم الطالب بنجاح"
    );
  } catch (err) {
    console.error("خطأ في تحديث تقدم الطالب:", err);
    return error(res, "فشل في تحديث تقدم الطالب", 500, err);
  }
};
