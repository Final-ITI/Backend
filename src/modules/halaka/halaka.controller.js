import Halaka from "../../../DB/models/halaka.js";
import {
  created,
  error,
  validationError,
  success,
  notFound,
} from "../../utils/apiResponse.js";
import Teacher from "../../../DB/models/teacher.js";
import Session from "../../../DB/models/session.js";

// --- ENROLLMENT CHATGROUP INTEGRATION (Uncomment when Enrollment is implemented) ---
/*
import ChatGroup from "../../../DB/models/chatGroup.js";
import Student from "../../../DB/models/student.js";
import Halaka from "../../../DB/models/halaka.js";

// After successful enrollment:
// const halaka = await Halaka.findById(halakaId);
// const chatGroup = await ChatGroup.findById(halaka.chatGroup);
// const studentDoc = await Student.findById(studentId).populate("user");
// if (studentDoc && studentDoc.user) {
//   if (!chatGroup.participants.includes(studentDoc.user._id)) {
//     chatGroup.participants.push(studentDoc.user._id);
//     await chatGroup.save();
//   }
// }
*/
// --- END ENROLLMENT CHATGROUP INTEGRATION ---
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

    // Validation
    if (!title || !halqaType || !schedule || !curriculum) {
      return validationError(res, [
        "Missing required fields: title, halqaType, schedule, curriculum",
      ]);
    }
    if (halqaType === "private" && !teacher.sessionPrice) {
      return validationError(res, ["Teacher does not have a sessionPrice set"]);
    }
    if (halqaType === "private" && !student) {
      return validationError(res, ["student is required for private halaka"]);
    }
    if (halqaType === "halqa" && !maxStudents) {
      return validationError(res, ["maxStudents is required for group halaka"]);
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "Teacher not found ", 403);
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
    const halaka = new Halaka(halakaData);
    await halaka.save();

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

export const getAllHalakat = async (req, res) => {
  try {
    const filter = {};
    if (req.query.teacher) filter.teacher = req.query.teacher;
    if (req.query.status) filter.status = req.query.status;

    const halakat = await Halaka.find(filter)
      .populate("teacher")
      .sort({ createdAt: -1 });
    return success(res, halakat, "Halakat fetched successfully");
  } catch (err) {
    return error(res, "Failed to fetch Halakat", 500, err);
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
    }).populate("teacher");
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

    const halakat = await Halaka.find({ teacher: teacher._id })
      .populate("teacher")
      .sort({ createdAt: -1 });
    return success(res, halakat, "Halakat fetched successfully");
  } catch (err) {
    return error(res, "Failed to fetch Halakat", 500, err);
  }
};

//session
// Get upcoming sessions for a specific Halaka
export const getUpcomingSessions = async (req, res) => {
  const halaka = await Halaka.findById(req.params.id);
  if (!halaka) return notFound(res, "Halaka not found");
  const sessions = halaka.getUpcomingSessions(5);
  const now = new Date();
  const sessionsWithStatus = sessions.map((session) => {
    const start = new Date(
      session.scheduledDate + "T" + session.scheduledStartTime
    );
    const end = new Date(
      session.scheduledDate + "T" + session.scheduledEndTime
    );
    let status = "scheduled";
    if (now >= start && now <= end) status = "in-progress";
    if (now > end) status = "completed";
    return { ...session, status };
  });
  return success(res, sessionsWithStatus, "Next session list");
};

//attendance
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
