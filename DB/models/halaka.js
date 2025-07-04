import mongoose from "mongoose";
const Schema = mongoose.Schema;
// const zoomService = require("../services/zoomService");

const halakaSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    student:{type: Schema.Types.ObjectId, ref: "Student"},
    halqaType:{
      required:true,
      enum:['private','halqa']
    },
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
      endTime :{},
      duration: { type: Number},
      startDate: { type: Date, required: true },
      endDate: Date,
      timezone: { type: String, default: "Africa/Cairo" },
    },
    curriculum: {
      type: String,
      enum: ["quran_memorization", "tajweed", "arabic", "islamic_studies"],
      required: true,
    },
    maxStudents: { type: Number, default: 15 },
    currentStudents: { type: Number, default: 0 },
    zoomMeeting: {
      meetingId: String,
      startUrl: String,
      joinUrl: String,
      password: String,
    },
    price: { type: Number, required: true },
    //     pricing: {
    //   individualSession: {
    //     type: Number,
    //     min: [0, "Price cannot be negative"],
    //   },
    //   groupSession: {
    //     type: Number,
    //     min: [0, "Price cannot be negative"],
    //   },
    //   monthlyPackage: {
    //     type: Number,
    //     min: [0, "Price cannot be negative"],
    //   },
    //   currency: {
    //     type: String,
    //     default: "SAR",
    //   },
    // },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
halakaSchema.virtual("upcomingSessions", {
  ref: "Session",
  localField: "_id",
  foreignField: "halaka",
  match: { status: "scheduled" },
  options: { sort: { scheduledDate: 1 }, limit: 5 },
});

halakaSchema.virtual("nextSession", {
  ref: "Session",
  localField: "_id",
  foreignField: "halaka",
  justOne: true,
  match: { status: "scheduled" },
  options: { sort: { scheduledDate: 1 }, limit: 1 },
});

// Pre-save hook for Zoom meeting
halakaSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const zoomMeeting = await zoomService.createRecurringMeeting({
        topic: this.title,
        start_time: this.schedule.startDate.toISOString(),
        duration: this.schedule.duration,
        timezone: this.schedule.timezone,
        recurrence: {
          type: this.schedule.frequency === "weekly" ? 2 : 1,
          repeat_interval: this.schedule.frequency === "biweekly" ? 2 : 1,
          weekly_days: this.schedule.days
            .map(
              (day) =>
                [
                  "sunday",
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                ].indexOf(day) + 1
            )
            .join(","),
          end_date_time: this.schedule.endDate.toISOString(),
        },
      });

      this.zoomMeeting = zoomMeeting;
    } catch (error) {
      console.error("Zoom meeting creation failed:", error);
    }
  }
  next();
});

// Post-save hook for session generation
halakaSchema.post("save", async function (doc) {
  if (doc.isNew) {
    const Session = mongoose.model("Session");
    const sessions = [];

    let currentDate = new Date(doc.schedule.startDate);
    const endDate = new Date(doc.schedule.endDate);

    while (currentDate <= endDate) {
      const dayName = currentDate
        .toLocaleString("en-US", { weekday: "long" })
        .toLowerCase();

      if (doc.schedule.days.includes(dayName)) {
        sessions.push({
          halaka: doc._id,
          teacher: doc.teacher,
          scheduledDate: new Date(currentDate),
          scheduledStartTime: doc.schedule.startTime,
          scheduledEndTime: calculateEndTime(
            doc.schedule.startTime,
            doc.schedule.duration
          ),
          zoomMeeting: doc.zoomMeeting,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    await Session.insertMany(sessions);
  }
});

function calculateEndTime(startTime, duration) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const endTime = new Date(0);
  endTime.setUTCHours(hours);
  endTime.setUTCMinutes(minutes + duration);
  return `${endTime.getUTCHours().toString().padStart(2, "0")}:${endTime
    .getUTCMinutes()
    .toString()
    .padStart(2, "0")}`;
}

export default mongoose.model("Halaka", halakaSchema);

/*
Fields
title: Name of the Halaka (e.g., “Quran Memorization”).

description: Short info about the Halaka (optional).

teacher: The teacher who created and manages this Halaka (required).

schedule:

frequency: How often the Halaka meets (daily, weekly, biweekly).

days: Which days of the week (e.g., Monday, Wednesday).

startTime: What time each session starts (e.g., 17:00).

duration: How long each session lasts (in minutes).

startDate: When the Halaka starts.

endDate: (Optional) When the Halaka ends.

timezone: The timezone for scheduling (default: Asia/Riyadh).

curriculum: What is taught (e.g., Quran memorization, tajweed).

maxStudents: Maximum number of students allowed.

currentStudents: How many students are currently enrolled.

zoomMeeting:

meetingId: Zoom meeting ID.

startUrl: Link for the teacher to start the meeting.

joinUrl: Link for students to join.

password: Meeting password.

price: Cost to join the Halaka (in SAR).

status: Current state of the Halaka (scheduled, active, completed, cancelled).
________________
Virtuals
_________________

upcomingSessions: Shows the next 5 scheduled sessions for this Halaka.


nextSession: Shows only the very next session for this Halaka.
____________________
Pre-save hook: 
____________________
When a new Halaka is created, it automatically sets up a Zoom meeting with the right schedule and saves the meeting details.

________________
Post-save hook: 
________________

After saving the Halaka, it creates all the session documents for each date that matches the schedule.

Helper Function
calculateEndTime: Figures out the end time of each session based on the start time and duration.


_______________
User Flow: Simple Steps
_______________



Teacher Creates a Halaka

Fills in the title, description, schedule, curriculum, price, etc.

System automatically creates a Zoom meeting and session documents for each date in the schedule.

Student Enrolls in the Halaka

Student sees available Halakat and chooses one.

Student enrolls and is asked to pay.

Once payment is done, enrollment is confirmed.

Student Joins Sessions

Student can see the next session and all upcoming sessions.

Student gets the Zoom link and password for each session.

Student joins the Zoom meeting at the scheduled time.

Teacher Manages Halaka

Teacher can see all upcoming sessions and who is enrolled.

Teacher starts the Zoom meeting and teaches the session.

Halaka Ends

When the end date is reached, the Halaka status changes to “completed.”







*/