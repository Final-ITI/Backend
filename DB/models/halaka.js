import mongoose from "mongoose";
import "./teacher.js";
import { createZoomMeeting } from "../../src/modules/zoom/zoom.service.js";

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
  if (!doc._wasNew) return;

  // add halaka → teacher.halakat[]
  await mongoose
    .model("Teacher")
    .findByIdAndUpdate(doc.teacher, { $addToSet: { halakat: doc._id } });

  // auto-enrol single student for private halaka
  if (doc.halqaType === "private" && doc.student) {
    const Enrollment = mongoose.model("Enrollment");
    await Enrollment.create({
      student: doc.student,
      halaka: doc._id,
      status: "pending_action",
      snapshot: {
        halakaTitle: doc.title,
        halakaType: doc.halqaType,
      },
    });
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
