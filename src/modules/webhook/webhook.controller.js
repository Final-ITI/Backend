// src/modules/webhook/webhook.controller.js

import Halaka from "../../../DB/models/halaka.js";
import User from "../../../DB/models/user.js";
import Student from "../../../DB/models/student.js";
import crypto from "crypto";
import { success, error, notFound } from "../../utils/apiResponse.js";

async function upsertAttendance({
  halaka,
  sessionDate,
  studentId,
  action,
  eventTime,
}) {
  let entry = halaka.attendance.find(
    (e) => e.sessionDate.toISOString().slice(0, 10) === sessionDate.slice(0, 10)
  );
  if (!entry) {
    entry = { sessionDate: new Date(sessionDate), records: [] };
    halaka.attendance.push(entry);
  }
  let studentRec = entry.records.find(
    (r) => r.student.toString() === studentId.toString()
  );
  if (!studentRec) {
    studentRec = { student: studentId };
    entry.records.push(studentRec);
  }
  if (action === "join") {
    studentRec.status = "present";
    studentRec.timeIn = eventTime;
  }
  if (action === "leave") {
    studentRec.timeOut = eventTime;
  }
}

export const zoomAttendanceWebhook = async (req, res) => {
  try {
    // 1. Handle validation challenge and exit early
    if (req.body.event === "endpoint.url_validation") {
      const plainToken = req.body.payload.plainToken;
      const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
      const encryptedToken = crypto
        .createHmac("sha256", secret)
        .update(plainToken)
        .digest("hex");
      // Do not run any other logic for validation events
      return res.status(200).json({ plainToken, encryptedToken });
    }

    // 2. All remaining code is ONLY for proper webhook events
    const { event, payload } = req.body;
    const meetingId = payload?.object?.id;
    const participant = payload?.object?.participant;

    const eventTime =
      participant?.join_time || participant?.leave_time || new Date();

    // Find halaka
    const halaka = await Halaka.findOne({ "zoomMeeting.meetingId": meetingId });
    if (!halaka) return notFound(res, "Halaka not found for meeting", 404);

    const user = await User.findOne({ email: participant?.email });
    if (!user) return notFound(res, "User email not found", 404);

    // Use userId field as defined in your schema
    const student = await Student.findOne({ userId: user._id });
    if (!student) return notFound(res, "Student not found for this email", 404);

    const sessionDate = new Date(eventTime).toISOString().slice(0, 10);

    if (event === "meeting.participant_joined") {
      await upsertAttendance({
        halaka,
        sessionDate,
        studentId: student._id,
        action: "join",
        eventTime,
      });
    }
    if (event === "meeting.participant_left") {
      await upsertAttendance({
        halaka,
        sessionDate,
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
