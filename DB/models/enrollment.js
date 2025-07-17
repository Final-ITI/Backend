import mongoose from "mongoose";
const Schema = mongoose.Schema;

const enrollmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    halaka: { type: Schema.Types.ObjectId, ref: "Halaka", required: true },
    enrollmentDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending_payment", "active", "completed", "cancelled"],
      default: "pending_payment",
    },
    payment: {
      paymentId: String,
      amount: Number,
      currency: { type: String, default: "EGP" },
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
      paymentDate: Date,
      paymentMethod: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
enrollmentSchema.virtual("halakaDetails", {
  ref: "Halaka",
  localField: "halaka",
  foreignField: "_id",
  justOne: true,
});

enrollmentSchema.virtual("studentProfile", {
  ref: "Student",
  localField: "student",
  foreignField: "_id",
  justOne: true,
});

export default mongoose.model("Enrollment", enrollmentSchema);

/*
Fields
student:

Type: Reference to the Student model

Required: Yes

Purpose: Links to the student who enrolled

halaka:

Type: Reference to the Halaka model

Required: Yes

Purpose: Links to the Halaka (group session) the student joined

enrollmentDate:

Type: Date

Default: Current date/time

Purpose: Tracks when enrollment occurred

status:

Type: String (enum)

Options: pending_payment, active, completed, cancelled

Default: pending_payment

Purpose: Tracks enrollment lifecycle

payment:

Type: Object

Details:

paymentId: Transaction ID from payment gateway

amount: Payment amount

currency: Currency (default: SAR)

status: Payment state (pending/paid/failed)

paymentDate: When payment occurred

paymentMethod: How payment was made (e.g., credit card)

Virtuals
halakaDetails:

What it does: Populates the full Halaka document

Usage: enrollment.halakaDetails → Halaka object

studentProfile:

What it does: Populates the full Student document

Usage: enrollment.studentProfile → Student object


______________
userFlow
______________


Teacher Creates Halaka

Sets schedule, price, curriculum

System creates Zoom meeting and sessions

Student Enrolls

Enrollment created with pending_payment status

Student redirected to payment gateway

Payment Processing

Successful payment activates enrollment

Student count incremented in Halaka

Accessing Halaka

Active students see upcoming sessions

Zoom links available for next session

Teacher manages sessions through dashboard


*/