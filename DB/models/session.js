import mongoose from "mongoose";
const Schema = mongoose.Schema;

const sessionSchema = new Schema(
  {
    halaka: { type: Schema.Types.ObjectId, ref: "Halaka", required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    scheduledDate: { type: Date, required: true },
    scheduledStartTime: String,
    scheduledEndTime: String,
    zoomMeeting: {
      meetingId: String,
      startUrl: String,
      joinUrl: String,
      password: String,
    },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
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
sessionSchema.virtual("formattedDate").get(function () {
  return this.scheduledDate.toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

/*
{
  "scheduledDate": "2025-06-22T00:00:00.000Z",
  "formattedDate": "الأحد، 22 يونيو 2025"
}
*/

sessionSchema.virtual("formattedTime").get(function () {
  return `${this.scheduledStartTime} - ${this.scheduledEndTime}`;
});

/*
{
  "scheduledStartTime": "10:00",
  "scheduledEndTime": "11:30",
  "formattedTime": 10:00 - 11:30
  
  }
*/

export default mongoose.model("Session", sessionSchema);

/*
Fields
halaka:

Type: Reference to the Halaka group this session belongs to

Purpose: Links the session to its parent Halaka (required)

teacher:

Type: Reference to the Teacher

Purpose: Shows who will teach this session (required)

scheduledDate:

Type: Date

Purpose: The day the session is scheduled (required)

scheduledStartTime:

Type: String (e.g., "17:00")

Purpose: What time the session starts

scheduledEndTime:

Type: String (e.g., "18:00")

Purpose: What time the session ends

zoomMeeting:

Type: Object with Zoom meeting details

Purpose: Stores the Zoom meeting ID, start URL, join URL, and password for the session

status:

Type: String, enum

Purpose: Shows if the session is scheduled, in-progress, completed, or cancelled

Virtuals
formattedDate:

What it does: Returns the session date in Arabic format (e.g., "الأحد ١ يوليو ٢٠٢٥")

formattedTime:

What it does: Returns the session start and end time together (e.g., "17:00 - 18:00")

Methods
No custom methods are defined here.

All logic is handled by the fields and virtuals.

The schema uses Mongoose's built-in features for timestamps and virtuals.

User Flow: Simple Steps
Session is Created

When a Halaka is created, the system automatically makes session documents for each date in the schedule.

Each session gets the Zoom meeting details from the Halaka.

Teacher and Students See Session Details

Teachers and students can see the date, time, and Zoom link for each session.

The date is shown in Arabic, and the time is shown as a range.

Session Status Changes

The session status starts as “scheduled.”

When the teacher starts the session, it can be set to “in-progress.”

After the session, it changes to “completed.”

If a session is cancelled, it changes to “cancelled.”

Zoom Meeting Access

Teachers use the “startUrl” to start the Zoom meeting.

Students use the “joinUrl” to join the session at the scheduled time.

*/