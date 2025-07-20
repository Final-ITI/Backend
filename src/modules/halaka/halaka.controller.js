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

//teacher
export const createHalaka = async (req, res) => {
  try {
    const {
      title,
      description,
      halqaType,
      student,
      schedule,
      curriculum,
      maxStudents,
      price,
    } = req.body;

    // Basic validation first
    if (!title || !halqaType || !schedule || !curriculum) {
      return validationError(res, [
        "Missing required fields: title, halqaType, schedule, curriculum",
      ]);
    }

    // Get teacher BEFORE validation that uses teacher data
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "Teacher not found", 403);
    }

    // Now you can safely validate using teacher data
    if (halqaType === "private" && !teacher.sessionPrice) {
      return validationError(res, ["Teacher does not have a sessionPrice set"]);
    }
    if (halqaType === "private" && !student) {
      return validationError(res, ["student is required for private halaka"]);
    }
    if (halqaType === "halqa" && !maxStudents) {
      return validationError(res, ["maxStudents is required for group halaka"]);
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
      halakaData.student = student;
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

    return created(res, halaka, "Halaka created successfully");
  } catch (err) {
    console.error("❌ Create Halaka Error:", err);
    return error(res, "Server error", 500, err);
  }
};

export const updateHalaka = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "Teacher not found", 403);
    }

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka) return notFound(res, "Halaka not found");

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
    return success(res, halaka, "Halaka updated successfully");
  } catch (err) {
    return error(res, "Failed to update Halaka", 500, err);
  }
};

export const getHalakaById = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "Teacher not found", 403);
    }

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka) return notFound(res, "Halaka not found or not yours");
    return success(res, halaka, "Halaka fetched successfully");
  } catch (err) {
    return error(res, "Failed to fetch Halaka", 500, err);
  }
};

export const deleteHalaka = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "Teacher not found", 403);
    }

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka) return notFound(res, "Halaka not found or not yours");

    await Session.deleteMany({ halaka: halaka._id });
    await Teacher.findByIdAndUpdate(halaka.teacher, {
      $pull: { halakat: halaka._id },
    });
    await halaka.deleteOne();

    return success(
      res,
      null,
      "Halaka and all related data deleted successfully"
    );
  } catch (err) {
    return error(res, "Failed to delete Halaka", 500, err);
  }
};

export const getHalakatByTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "Teacher not found", 403);
    }

    const halakat = await Halaka.find({ teacher: teacher._id }).sort({
      createdAt: -1,
    });
    return success(res, halakat, "Halakat fetched successfully");
  } catch (err) {
    return error(res, "Failed to fetch Halakat", 500, err);
  }
};

//session
// Get upcoming sessions for a specific Halaka
// Update your existing getUpcomingSessions function
export const getUpcomingSessions = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "Teacher not found", 403);
    }

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka) return notFound(res, "Halaka not found or not yours");

    const sessions = halaka.getUpcomingSessions(5);
    const now = new Date();

    const formattedSessions = sessions.map((session) => ({
      scheduledDate: session.scheduledDate,
      scheduledStartTime: session.scheduledStartTime,
      scheduledEndTime: session.scheduledEndTime,
      zoomMeeting: session.zoomMeeting,
      status: session.isCancelled
        ? "canceled"
        : session.scheduledDate < now
        ? "finished"
        : "upcoming",
    }));

    return success(res, "Upcoming sessions", formattedSessions);
  } catch (err) {
    console.error(err);
    return error(res, "Server error");
  }
};

//attendance
// Get attendance records for a specific Halaka
export const getHalakaAttendance = async (req, res) => {
  try {
    const halaka = await Halaka.findById(req.params.id).populate({
      path: "attendance.records.student",
      populate: {
        path: "userId",
        select: "firstName lastName email _id",
      },
    });
    if (!halaka) return notFound(res, "Halaka not found");

    let attendance = halaka.attendance;
    if (req.query.date)
      attendance = attendance.filter(
        (a) => a.sessionDate.toISOString().slice(0, 10) === req.query.date
      );

    // Format each record for name and student ID
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
              },
              status: r.status,
              timeIn: r.timeIn,
              timeOut: r.timeOut,
            }
          : null;
      }),
    }));

    return success(res, formatted, "Attendance data fetched");
  } catch (err) {
    return error(res, "Failed to fetch attendance", 500, err);
  }
};

//get all halakat in system filtered by teacher, title, status, curriculum
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

    // Transform each Halaka to the required card format
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

    return paginated(res, transformed, paginationInfo);
  } catch (err) {
    console.log(err);
    return error(res, "Failed to fetch Halakat", 500, err);
  }
};

//session cancelation

const yyyymmdd = (d) => new Date(d).toISOString().slice(0, 10);

/* -------------------------------------------------- *
 * Cancel Session                                     *
 * -------------------------------------------------- */
export const cancelSession = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) return error(res, "Teacher not found", 403);

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka) return notFound(res, "Halaka not found or not yours");

    /* Validate input ------------------------------------------------ */
    if (!req.body.sessionDate)
      return error(res, "sessionDate is required", 400);

    const reqDate = yyyymmdd(req.body.sessionDate);

    /* Build full session list incl. already-cancelled slots --------- */
    const need =
      (halaka.totalSessions || 0) + (halaka.cancelledSessions?.length || 0);
    const dates = getAllSessionDates(halaka.schedule, need);

    const match = dates.find((d) => yyyymmdd(d) === reqDate);
    if (!match)
      return error(
        res,
        "Session date is not a valid upcoming scheduled session",
        400
      );

    if (
      halaka.cancelledSessions?.some((c) => yyyymmdd(c.sessionDate) === reqDate)
    )
      return error(res, "Session was already cancelled", 400);

    /* Record cancellation ------------------------------------------ */
    halaka.cancelledSessions.push({
      sessionDate: match,
      reason: req.body.reason || "",
      cancelledBy: teacher._id,
    });

    /* Recalculate endDate & save ----------------------------------- */
    const newNeed =
      (halaka.totalSessions || 0) + halaka.cancelledSessions.length;
    const extDates = getAllSessionDates(halaka.schedule, newNeed);
    halaka.schedule.endDate = extDates[extDates.length - 1];
    halaka.markModified("schedule"); // tell Mongoose nested field changed
    await halaka.save();

    return success(
      res,
      {
        cancelledSession: { sessionDate: match, reason: req.body.reason || "" },
        newEndDate: halaka.schedule.endDate,
      },
      "Session cancelled and schedule updated"
    );
  } catch (err) {
    console.error("Cancel Session Error:", err);
    return error(res, "Failed to cancel session", 500, err);
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
    if (!teacher) return error(res, "Teacher not found", 403);

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka) return notFound(res, "Halaka not found or not yours");

    const cancelledCnt = halaka.cancelledSessions?.length || 0;
    const fullList = getAllSessionDates(
      halaka.schedule,
      (halaka.totalSessions || 0) + cancelledCnt
    );

    const completedCnt = halaka.attendance.filter(
      (a) => yyyymmdd(a.sessionDate) <= yyyymmdd(new Date())
    ).length;

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

    return success(res, analytics, "Session analytics generated");
  } catch (err) {
    console.error("Analytics Error:", err);
    return error(res, "Failed to generate session analytics", 500, err);
  }
};

//restore and get
// Get cancelled sessions for a halaka
export const getCancelledSessions = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "Teacher not found", 403);
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
      return notFound(res, "Halaka not found or not yours");
    }

    const cancelledSessions = halaka.cancelledSessions.map((cancelled) => ({
      sessionDate: cancelled.sessionDate,
      cancelledAt: cancelled.cancelledAt,
      reason: cancelled.reason,
      cancelledBy: cancelled.cancelledBy?.userId
        ? `${cancelled.cancelledBy.userId.firstName} ${cancelled.cancelledBy.userId.lastName}`
        : "Unknown",
    }));

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
      "Cancelled sessions fetched successfully"
    );
  } catch (err) {
    console.error("Get Cancelled Sessions Error:", err);
    return error(res, "Failed to fetch cancelled sessions", 500, err);
  }
};

// Restore a cancelled session (optional feature)
export const restoreSession = async (req, res) => {
  try {
    const { sessionDate } = req.body;

    if (!sessionDate) {
      return validationError(res, ["Session date is required"]);
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "Teacher not found", 403);
    }

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });

    if (!halaka) {
      return notFound(res, "Halaka not found or not yours");
    }

    // Find and remove the cancelled session
    const sessionDateObj = new Date(sessionDate);
    const cancelledIndex = halaka.cancelledSessions.findIndex(
      (cancelled) =>
        cancelled.sessionDate.toISOString().slice(0, 10) ===
        sessionDateObj.toISOString().slice(0, 10)
    );

    if (cancelledIndex === -1) {
      return error(res, "Session was not cancelled", 400);
    }

    // Remove from cancelled sessions
    halaka.cancelledSessions.splice(cancelledIndex, 1);

    // Recalculate end date (may shrink the schedule)
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
      "Session restored successfully"
    );
  } catch (err) {
    console.error("Restore Session Error:", err);
    return error(res, "Failed to restore session", 500, err);
  }
};
