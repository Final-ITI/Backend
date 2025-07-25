import Halaka from "../../../DB/models/halaka.js";
import User from "../../../DB/models/user.js";
import Student from "../../../DB/models/student.js";
import crypto from "crypto";
import { success, error, notFound } from "../../utils/apiResponse.js";

/**
 * Find the session date from schedule that matches the event date.
 * Returns the scheduled date object if matched, or null if not found.
 */
function getScheduledSessionDate(schedule, eventTimeIso) {
  if (!schedule?.days?.length) return null;
  const eventDate = new Date(eventTimeIso);
  const eventDay = eventDate
    .toLocaleString("en-US", { weekday: "long" })
    .toLowerCase();
  const sessionDays = schedule.days;

  // Only consider session days after startDate, before endDate, and matching the day
  let datePtr = new Date(schedule.startDate);
  const endDate = new Date(schedule.endDate);
  while (datePtr <= endDate) {
    const dayName = datePtr
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();
    // If the recurring session is on the same day and same date as the Zoom event
    if (
      sessionDays.includes(dayName) &&
      datePtr.toISOString().slice(0, 10) ===
        eventDate.toISOString().slice(0, 10)
    ) {
      return new Date(datePtr);
    }
    datePtr.setDate(datePtr.getDate() + 1);
  }
  return null; // No matching scheduled session for this event!
}

async function upsertAttendance({
  halaka,
  sessionDate,
  studentId,
  action,
  eventTime,
}) {
  let entry = halaka.attendance.find(
    (e) =>
      e.sessionDate &&
      e.sessionDate.toISOString().slice(0, 10) === sessionDate.slice(0, 10)
  );

  if (!entry) {
    // Initialize with all expected students marked as absent
    let expectedStudentIds = [];
    if (halaka.halqaType === "private" && halaka.student) {
      expectedStudentIds = [String(halaka.student)];
    } else if (halaka.halqaType === "halqa") {
      expectedStudentIds = (halaka.students || []).map((s) => String(s));
    }

    // Build records
    const records = expectedStudentIds.map((id) => ({
      student: id,
      status:
        id === String(studentId) && action === "join" ? "present" : "absent",
      ...(id === String(studentId) && action === "join"
        ? { timeIn: eventTime }
        : {}),
    }));

    entry = { sessionDate: new Date(sessionDate), records };
    halaka.attendance.push(entry);
  } else {
    // If entry exists, update or create student record
    let studentRec = entry.records.find(
      (r) => r.student.toString() === studentId.toString()
    );

    if (!studentRec) {
      studentRec = {
        student: studentId,
        status: action === "join" ? "present" : "absent",
        ...(action === "join" ? { timeIn: eventTime } : {}),
      };
      entry.records.push(studentRec);
    } else {
      if (action === "join") {
        studentRec.status = "present";
        studentRec.timeIn = eventTime;
      }
      if (action === "leave") {
        studentRec.timeOut = eventTime;
      }
    }
  }
}

async function markAbsenteesForSession(halaka, sessionDateIso) {
  // 1. Find or create the attendance entry for this session date
  let entry = halaka.attendance.find(
    (e) =>
      e.sessionDate &&
      e.sessionDate.toISOString().slice(0, 10) === sessionDateIso
  );

  // 2. Get the expected list of students
  let expectedStudentIds = [];
  if (halaka.halqaType === "private" && halaka.student) {
    expectedStudentIds = [String(halaka.student)];
  } else if (halaka.halqaType === "halqa") {
    expectedStudentIds = (halaka.students || []).map((s) => String(s));
  }

  if (!entry) {
    // 🔧 Initialize full entry with all students as absent
    const records = expectedStudentIds.map((studentId) => ({
      student: studentId,
      status: "absent",
    }));
    entry = { sessionDate: new Date(sessionDateIso), records };
    halaka.attendance.push(entry);
  } else {
    // 3. Fill in only the missing students
    expectedStudentIds.forEach((studentId) => {
      const rec = entry.records.find((r) => String(r.student) === studentId);

      if (!rec) {
        entry.records.push({
          student: studentId,
          status: "absent",
        });
      } else if (!rec.status || rec.status === "pending") {
        rec.status = "absent";
      }
    });
  }

  await halaka.save();
}

export const zoomAttendanceWebhook = async (req, res) => {
  try {
    // Zoom webhook URL validation (security challenge)
    if (req.body.event === "endpoint.url_validation") {
      const plainToken = req.body.payload.plainToken;
      const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
      const encryptedToken = crypto
        .createHmac("sha256", secret)
        .update(plainToken)
        .digest("hex");
      return res.status(200).json({ plainToken, encryptedToken });
    }

    const { event, payload } = req.body;
    const participant = payload?.object?.participant;
    const meetingId = payload?.object?.id;

    // -- Meeting ended: Mark absentees --
    if (event === "meeting.ended") {
      const halaka = await Halaka.findOne({
        "zoomMeeting.meetingId": meetingId,
      });
      if (!halaka) return notFound(res, "Halaka not found for meeting", 404);
      const endTime = payload?.object?.end_time || new Date().toISOString();
      const scheduledSessionDate = getScheduledSessionDate(
        halaka.schedule,
        endTime
      );
      if (!scheduledSessionDate) {
        return error(
          res,
          "Could not find the scheduled session for meeting end.",
          400
        );
      }
      const sessionDateIso = scheduledSessionDate.toISOString().slice(0, 10);

      await markAbsenteesForSession(halaka, sessionDateIso);

      return success(
        res,
        null,
        "تم تحديث الحضور للغائبين بعد نهاية الجلسة",
        200
      );
    }

    // --- Process join/leave events (unchanged) ---
    let eventTime;
    if (event === "meeting.participant_joined") {
      eventTime = participant?.join_time;
    } else if (event === "meeting.participant_left") {
      eventTime = participant?.leave_time;
    }
    if (!eventTime) eventTime = new Date().toISOString();

    // 1. Find halaka by Zoom meetingId
    const halaka = await Halaka.findOne({ "zoomMeeting.meetingId": meetingId });
    if (!halaka) return notFound(res, "Halaka not found for meeting", 404);

    // 2. Find user & student
    const user = await User.findOne({ email: participant?.email });
    if (!user) return notFound(res, "User email not found", 404);

    const student = await Student.findOne({ userId: user._id });
    if (!student) return notFound(res, "Student not found for this email", 404);

    // --- Restrict to only enrolled students ---
    if (halaka.halqaType === "private") {
      if (
        !halaka.student ||
        student._id.toString() !== halaka.student.toString()
      ) {
        return success(
          res,
          null,
          "Ignored: student is not the enrolled private student."
        );
      }
    } else if (halaka.halqaType === "halqa") {
      if (
        !Array.isArray(halaka.students) ||
        !halaka.students
          .map((id) => id.toString())
          .includes(student._id.toString())
      ) {
        return success(res, null, "Ignored: student not in group halaka.");
      }
    }

    // --- Match sessionDate as the scheduled date, not join date ---
    const scheduledSessionDate = getScheduledSessionDate(
      halaka.schedule,
      eventTime
    );
    if (!scheduledSessionDate) {
      return error(
        res,
        "Could not correlate the Zoom event with a scheduled session for this halaka.",
        400
      );
    }
    const sessionDateIso = scheduledSessionDate.toISOString().slice(0, 10);

    // --- Attendance write ---
    if (event === "meeting.participant_joined") {
      await upsertAttendance({
        halaka,
        sessionDate: sessionDateIso,
        studentId: student._id,
        action: "join",
        eventTime,
      });
    }
    if (event === "meeting.participant_left") {
      await upsertAttendance({
        halaka,
        sessionDate: sessionDateIso,
        studentId: student._id,
        action: "leave",
        eventTime,
      });
    }
    await halaka.save();
    return success(res, null, "Attendance updated from Zoom", 200);
  } catch (err) {
    console.log(err);
    return error(res, "Failed to process Zoom webhook", 500, err);
  }
};
