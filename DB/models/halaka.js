import mongoose from "mongoose";
import "./teacher.js";
import { createZoomMeeting } from "../../src/modules/zoom/zoom.service.js";
import { sendNotification } from "../../src/services/notification.service.js";
import { HalakaMailService } from "../../src/services/email.service.js";
import ApiError from "../../src/utils/apiError.js";

const Schema = mongoose.Schema;

const halakaSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    students: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    student: { type: Schema.Types.ObjectId, ref: "Student" },
    chatGroup: { type: Schema.Types.ObjectId, ref: "ChatGroup" }, // Reference to chat group
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
    curriculum: {
      type: String,
      enum: ["quran_memorization", "tajweed", "arabic", "islamic_studies"],
      required: true,
    },
    maxStudents: { type: Number, default: 15 },
    currentStudents: { type: Number, default: 0 },
    zoomMeeting: {
      meetingId: String,
      password: String,
      joinUrl: String,
      startUrl: String,
    },
    price: { type: Number, required: true },
    totalSessions: { type: Number },
    totalPrice: { type: Number },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },
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
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Pre-save: Create Zoom meeting
halakaSchema.pre("save", async function (next) {
  this._wasNew = this.isNew;
  if (this.isNew) {
    try {
      // Calculate total sessions and price if schedule and price are set
      if (this.schedule && this.price) {
        const sessions = countAllSessions(this.schedule);
        this.totalSessions = sessions;
        this.totalPrice = sessions * this.price;
      }
      // Generate recurrence object based on schedule
      const recurrence = getRecurrenceFromSchedule(this.schedule);
      const zoomMeeting = await createZoomMeeting({
        topic: this.title,
        start_time: this.schedule.startDate.toISOString(),
        duration: this.schedule.duration,
        timezone: this.schedule.timezone,
        password: Math.random().toString(36).slice(-8),
        recurrence,
      });
      this.zoomMeeting = zoomMeeting;
    } catch (error) {
      console.error("Zoom meeting creation failed:", error);
      return next(error);
    }
  }
  next();
});

// In halakaSchema.js

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

halakaSchema.methods.getUpcomingSessions = function (
  count = 5,
  fromDate = new Date()
) {
  const sessions = [];
  let currentDate = new Date(fromDate);
  const endDate = new Date(this.schedule.endDate);
  let added = 0;

  // Loop until you've found as many as requested or reach end date
  while (currentDate <= endDate && added < count) {
    const dayName = currentDate
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();
    if (
      this.schedule.days.includes(dayName) &&
      currentDate >= new Date(this.schedule.startDate)
    ) {
      sessions.push({
        scheduledDate: new Date(currentDate),
        scheduledStartTime: this.schedule.startTime,
        scheduledEndTime: calculateEndTime(
          this.schedule.startTime,
          this.schedule.duration
        ),
        zoomMeeting: this.zoomMeeting,
      });
      added += 1;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return sessions;
};

function getRecurrenceFromSchedule(schedule) {
  const daysMap = {
    sunday: 1,
    monday: 2,
    tuesday: 3,
    wednesday: 4,
    thursday: 5,
    friday: 6,
    saturday: 7,
  };
  return {
    type: 2, // for weekly recurrence
    repeat_interval: 1,
    weekly_days: schedule.days.map((day) => daysMap[day]).join(","),
    end_date_time: schedule.endDate.toISOString(), // expects a Date
  };
}

function calculateEndTime(startTime, duration) {
  const [hours, minutes] = startTime.split(":").map(Number);
  let totalMinutes = hours * 60 + (minutes || 0) + (duration || 0);
  totalMinutes = totalMinutes % (24 * 60);
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMinutes
    .toString()
    .padStart(2, "0")}`;
}

function countAllSessions(schedule) {
  let count = 0;
  let currentDate = new Date(schedule.startDate);
  const endDate = new Date(schedule.endDate);
  const allowedDays = schedule.days;
  while (currentDate <= endDate) {
    const dayName = currentDate
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();
    if (allowedDays.includes(dayName)) count++;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return count;
}
const Halaka = mongoose.models.Halaka || mongoose.model("Halaka", halakaSchema);

export default Halaka;
