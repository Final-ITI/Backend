import mongoose from "mongoose";
import "./teacher.js";
import { createZoomMeeting } from "../../src/modules/zoom/zoom.service.js";
import { sendNotification } from "../../src/services/notification.service.js";
import ApiError from "../../src/utils/apiError.js";
import { HalakaMailService } from "../../src/services/email.service.js";

const { Schema } = mongoose;

/* ------------------------------------------------------------------ */
/*  MAIN SCHEMA                                                       */
/* ------------------------------------------------------------------ */
const halakaSchema = new Schema(
  {
    /*  Basic Info  */
    title: { type: String, required: true },
    description: String,

    /*  Relations   */
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    student: { type: Schema.Types.ObjectId, ref: "Student" }, // private
    students: [{ type: Schema.Types.ObjectId, ref: "Student" }], // group
    chatGroup: { type: Schema.Types.ObjectId, ref: "ChatGroup" },

    /*  Type & Schedule  */
    halqaType: { type: String, required: true, enum: ["private", "halqa"] },
    schedule: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "biweekly"],
        default: "weekly",
      },
      days: [
        {
          type: String,
          enum: [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ],
        },
      ],
      startTime: { type: String, required: true },
      duration: { type: Number },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      timezone: { type: String, default: "Africa/Cairo" },
    },

    /*  Business fields  */
    curriculum: {
      type: String,
      required: true,
      enum: ["quran_memorization", "tajweed", "arabic", "islamic_studies"],
    },
    maxStudents: { type: Number, default: 15 },
    currentStudents: { type: Number, default: 0 },
    price: { type: Number, required: true },

    /*  Zoom info  */
    zoomMeeting: {
      meetingId: String,
      password: String,
      joinUrl: String,
      startUrl: String,
    },

    /*  Statistics  */
    totalSessions: { type: Number },
    totalPrice: { type: Number },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },

    /*  Attendance & Cancellations  */
    attendance: [
      {
        sessionDate: Date,
        records: [
          {
            student: { type: Schema.Types.ObjectId, ref: "Student" },
            status: {
              type: String,
              enum: ["present", "absent", "late", "excused"],
              default: "present",
            },
            timeIn: Date,
            timeOut: Date,
            score: { type: Number, min: 1, max: 10 }, // Changed from 0-100 to 1-10
            notes: { type: String, trim: true }, // New field for notes
          },
        ],
      },
    ],
    cancelledSessions: [
      {
        sessionDate: { type: Date, required: true },
        cancelledAt: { type: Date, default: Date.now },
        reason: { type: String, default: "" },
        cancelledBy: {
          type: Schema.Types.ObjectId,
          ref: "Teacher",
          required: true,
        },
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* ------------------------------------------------------------------ */
/*  HOOKS                                                             */
/* ------------------------------------------------------------------ */
halakaSchema.pre("save", async function (next) {
  this._wasNew = this.isNew;
  if (!this.isNew) return next();

  // totalSessions & totalPrice
  const sessions = countAllSessions(this.schedule);
  this.totalSessions = sessions;
  this.totalPrice = sessions * this.price;

  // create Zoom meeting
  try {
    const zoomRecurrence = getRecurrenceFromSchedule(this.schedule);
    this.zoomMeeting = await createZoomMeeting({
      topic: this.title,
      start_time: this.schedule.startDate.toISOString(),
      duration: this.schedule.duration,
      timezone: this.schedule.timezone,
      password: Math.random().toString(36).slice(-8),
      recurrence: zoomRecurrence,
    });
  } catch (err) {
    return next(err);
  }

  next();
});

halakaSchema.post("save", async function (doc) {
  // We only want to run this for NEWLY created documents.
  // The _wasNew property you set in the pre-hook is perfect for this.
  if (!doc._wasNew) {
    return;
  }

  let teacher;
  if (doc._wasNew) {
    try {
      teacher = await mongoose
        .model("Teacher")
        .findByIdAndUpdate(doc.teacher, { $addToSet: { halakat: doc._id } });
    } catch (error) {
      console.error("❌ Error updating teacher's halakat:", error);
    }
  }
  // --- Logic Block 2: Create enrollment and send notification for PRIVATE halaqas ---
  if (doc.halqaType === "private" && doc.student) {
    console.log("Creating enrollment for private halaka:", doc._id);
    // Use 'type' as we agreed
    try {
      // Fetch all necessary data INSIDE this block to be self-contained
      const Teacher = mongoose.model("Teacher");
      const Enrollment = mongoose.model("Enrollment");

      // Fetch the full teacher profile to get their name and session price
      const teacherProfile = await Teacher.findById(doc.teacher).populate({
        path: "userId",
        select: "firstName lastName fullName",
      });

      if (!teacherProfile || !teacherProfile.userId) {
        throw new ApiError("Teacher profile not found or incomplete.", 404);
      }

      const teacherName = `${teacherProfile.userId.firstName} ${teacherProfile.userId.lastName}`;

      // Create the enrollment with the correct snapshot based on our latest logic
      const enrollment = await Enrollment.create({
        student: doc.student,
        halaka: doc._id,
        status: "pending_action",
        snapshot: {
          halakaTitle: doc.title,
          pricePerStudent: doc.totalPrice,
          pricePerSession: doc.price,
          currency: doc.currency || "EGP",
        },
      });
      console.log("✅ Enrollment created for private halaka:", enrollment._id);
      // Find the student's main user ID to send the notification to
      const studentProfile = await mongoose
        .model("Student")
        .findById(doc.student)
        .select("userId");
      if (!studentProfile)
        throw new ApiError(
          "Student profile not found to send notification.",
          404
        );

      // Send the notification
      await sendNotification({
        recipient: studentProfile.userId, // Send to the main User ID
        sender: teacherProfile.userId._id, // Send from the main User ID
        type: "halaka_invitation",
        message: `المعلم ${teacherName} يدعوك للانضمام إلى حلقة "${doc.title}"`,
        link: `/enrollments/invitations/${enrollment._id}`, // A more descriptive link
      });

      // Send email invitation
      try {
        // Get student's email from the user document
        const studentUser = await mongoose
          .model("User")
          .findById(studentProfile.userId);
        if (studentUser && studentUser.email) {
          const enrollmentLink = `${process.env.FE_URL}/enrollments/invitations/${enrollment._id}`;

          await HalakaMailService.sendHalakaInvitationEmail(
            studentUser.email,
            `${studentUser.firstName} ${studentUser.lastName}`,
            teacherName,
            {
              title: doc.title,
              description: doc.description,
              schedule: doc.schedule,
              price: doc.price,
            },
            enrollmentLink
          );

          console.log(
            "✅ Email invitation sent successfully to:",
            studentUser.email
          );
        }
      } catch (emailError) {
        console.error("❌ Failed to send email invitation:", emailError);
        // Don't throw error here to avoid breaking the main flow
      }
    } catch (error) {
      console.error(
        "❌ Failed to create enrollment or send notification for private halaka:",
        error
      );
    }
  }
});

/* ------------------------------------------------------------------ */
/*  INSTANCE METHODS                                                  */
/* ------------------------------------------------------------------ */
halakaSchema.methods.isSessionCancelled = function (d) {
  const s = new Date(d).toISOString().slice(0, 10);
  return this.cancelledSessions.some(
    (c) => c.sessionDate.toISOString().slice(0, 10) === s
  );
};

halakaSchema.methods.getUpcomingSessions = function (
  limit = 5,
  from = new Date()
) {
  const sessions = [];
  let current = new Date(from);
  const end = new Date(this.schedule.endDate);

  while (current <= end && sessions.length < limit) {
    const dayName = current
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();

    if (
      this.schedule.days.includes(dayName) &&
      current >= new Date(this.schedule.startDate)
    ) {
      const isCancelled = this.isSessionCancelled(current);

      sessions.push({
        scheduledDate: new Date(current),
        scheduledStartTime: this.schedule.startTime,
        scheduledEndTime: calculateEndTime(
          this.schedule.startTime,
          this.schedule.duration
        ),
        zoomMeeting: this.zoomMeeting,
        isCancelled: isCancelled, // new field
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return sessions;
};

halakaSchema.methods.calculateExtendedEndDate = function () {
  const originalTotal = this.totalSessions || 0;
  const cancelledCount = this.cancelledSessions?.length || 0;
  const needed = originalTotal + cancelledCount;
  return findNewEndDate(this.schedule.startDate, this.schedule.days, needed);
};
/* ------------------------------------------------------------------ */
/*  STATIC / UTILITY FUNCTIONS                                        */
/* ------------------------------------------------------------------ */
export function calculateEndTime(start, duration = 0) {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + (m || 0) + duration;
  const eh = Math.floor((total % (24 * 60)) / 60);
  const em = total % 60;
  return `${eh.toString().padStart(2, "0")}:${em.toString().padStart(2, "0")}`;
}

export function countAllSessions(schedule) {
  let count = 0;
  let cur = new Date(schedule.startDate);
  const end = new Date(schedule.endDate);

  while (cur <= end) {
    const d = cur.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
    if (schedule.days.includes(d)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function getAllSessionDates(schedule, needed) {
  const dates = [];
  let cur = new Date(schedule.startDate);
  let guard = 0;

  while (dates.length < needed && guard < 1000) {
    const d = cur.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
    if (schedule.days.includes(d)) dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return dates;
}

function getRecurrenceFromSchedule(schedule) {
  const dayMap = {
    sunday: 1,
    monday: 2,
    tuesday: 3,
    wednesday: 4,
    thursday: 5,
    friday: 6,
    saturday: 7,
  };
  return {
    type: 2,
    repeat_interval: 1,
    weekly_days: schedule.days.map((d) => dayMap[d]).join(","),
    end_date_time: schedule.endDate.toISOString(),
  };
}

function findNewEndDate(start, daysArr, sessionsNeeded) {
  let cur = new Date(start);
  let cnt = 0;
  while (cnt < sessionsNeeded) {
    const d = cur.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
    if (daysArr.includes(d)) cnt++;
    if (cnt < sessionsNeeded) cur.setDate(cur.getDate() + 1);
  }
  return cur;
}

const Halaka = mongoose.models.Halaka || mongoose.model("Halaka", halakaSchema);
export default Halaka;
