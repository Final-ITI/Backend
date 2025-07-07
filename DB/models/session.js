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

// Virtual for formatted date (Arabic)
sessionSchema.virtual("formattedDate").get(function () {
  return this.scheduledDate.toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Virtual for formatted time
sessionSchema.virtual("formattedTime").get(function () {
  return `${this.scheduledStartTime} - ${this.scheduledEndTime}`;
});

export default mongoose.model("Session", sessionSchema);
