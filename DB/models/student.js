import mongoose from "mongoose";
const Schema = mongoose.Schema;

const studentSchema = new Schema(
  {
    // Reference to base User (required)
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Student-specific fields
    birthDate: {
      type: Date,
      required: true,
    },
    guardianName: {
      type: String,
      required: function () {
        return this.isMinor();
      },
    },
    guardianPhone: {
      type: String,
      required: function () {
        return this.isMinor();
      },
      match: [
        /^[+]?[0-9\s\-\(\)]{10,15}$/,
        "Please provide a valid phone number",
      ],
    },

    // Document verification (complements User docs)
    studentIdDocument: {
      type: String, // File path or URL
      required: true,
    },
    guardianIdDocument: {
      type: String, // File path or URL
      required: function () {
        return this.isMinor();
      },
    },

    // Academic progress
    memorizationLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    lastMemorizedPage: Number,
    lastMemorizedSurah: String,
    certifications: [
      {
        name: String,
        issueDate: Date,
        certificateFile: String,
      },
    ],

    // Preferences
    preferredTeachers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Teacher",
      },
    ],
    learningGoals: {
      dailyVerses: Number,
      targetCompletion: Date,
    },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for age calculation
studentSchema.virtual("age").get(function () {
  const diff = Date.now() - this.birthDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

// Virtual for required documents
studentSchema.virtual("requiredDocuments").get(function () {
  return this.age < 18
    ? ["student_id", "birth_certificate", "guardian_id"]
    : ["student_id"];
});

// Document relationship
studentSchema.virtual("documents", {
  ref: "Document",
  localField: "_id",
  foreignField: "ownerId",
  match: { ownerType: "student" },
});

// Auto-verification method
studentSchema.methods.checkVerification = async function () {
  const requiredDocs = this.requiredDocuments;
  const approvedDocs = await mongoose.model("Document").find({
    ownerId: this._id,
    ownerType: "student",
    status: "approved",
  });

  const hasAllDocs = requiredDocs.every((rdoc) =>
    approvedDocs.some((adoc) => adoc.docType === rdoc)
  );

  if (hasAllDocs) {
    this.isVerified = true;
    this.verificationStatus = "approved";
    await this.save();
  }
};

studentSchema.virtual("isMinor").get(function () {
  return this.age < 18;
});

// Virtual for required documents
studentSchema.virtual("requiredDocuments").get(function () {
  return this.age < 18
    ? ["student_id", "birth_certificate", "guardian_id"]
    : ["student_id"];
});

// Document status virtual
studentSchema.virtual("documents", {
  ref: "Document",
  localField: "_id",
  foreignField: "ownerId",
  match: { ownerType: "student" },
});

studentSchema.virtual("enrollments", {
  ref: "Enrollment",
  localField: "_id",
  foreignField: "student",
  justOne: false,
});

studentSchema.virtual("upcomingSessions", {
  ref: "Session",
  localField: "_id",
  foreignField: "student",
  match: { status: "scheduled" },
  options: { sort: { scheduledDate: 1 }, limit: 5 },
});

studentSchema.virtual("verificationStatus").get(function () {
  return this.user.verificationStatus; // From User model
});

// Document verification middleware
studentSchema.pre("save", function (next) {
  // Auto-set required documents for minors
  if (this.isMinor && !this.guardianIdDocument) {
    next(new Error("Guardian ID document is required for minors"));
  }
  next();
});

// Indexes
studentSchema.index({ user: 1 });
studentSchema.index({ birthDate: 1 });
studentSchema.index({ "learningGoals.targetCompletion": 1 });

export default mongoose.model("Student", studentSchema);

/*
 Main Fields
user

Reference to the base User model.

Required and unique—links each student to a user account.

birthDate

Date of birth.

Required for age calculation and guardian checks.

guardianName

Name of the guardian.

Required only if the student is a minor.

guardianPhone

Guardian’s phone number.

Required only if the student is a minor. Validated with a regex.

studentIdDocument

File path or URL to the student’s ID document.

Required for all students.

guardianIdDocument

File path or URL to the guardian’s ID document.

Required only if the student is a minor.

memorizationLevel

Student’s memorization proficiency.

Can be "beginner", "intermediate", or "advanced".

lastMemorizedPage

Last page memorized in the Quran.

Tracks progress.

lastMemorizedSurah

Last surah memorized.

Tracks progress.

certifications

Array of certification objects.

Each includes name, issue date, and file.

preferredTeachers

Array of references to Teacher models.

Tracks which teachers the student prefers.

learningGoals

Object with daily verses target and target completion date.

Helps track and set learning goals.

isVerified

Boolean indicating if the student is verified.

Set to true when all required documents are approved.

verificationStatus

Enum: pending, approved, rejected, suspended.

Shows current verification status.

2. Virtuals
age

Calculates the student’s age from birthDate.

requiredDocuments

Returns an array of required document types.

Minors need ID, birth certificate, and guardian ID; adults need only ID.

documents

Populates all documents related to the student.

Links to the Document model, filtered by ownerType.

enrollments

Populates all enrollments for the student.

Links to the Enrollment model.

upcomingSessions

Populates the next 5 scheduled sessions for the student.

Links to the Session model, sorted by date.

verificationStatus

Returns verification status from the linked User model.

(Note: This may be redundant if you also store it in the Student model.)

isMinor

Boolean. True if age < 18.

Used to enforce guardian requirements.

3. Methods
checkVerification

Async method.

Checks if all required documents are approved.

Updates isVerified and verificationStatus if true.

4. Middleware
preSave

Before saving, checks if guardianIdDocument is present for minors.

Throws an error if missing.

5. Indexes
user

Fast lookup by user reference.

birthDate

Fast lookup or sorting by age.

learningGoals.targetCompletion

Fast lookup by target completion date.
________________
6. Flow & Logic
_______________
Student Registration

Student fills in details and uploads required documents.

If minor, guardian info and guardian ID are required.

Document Verification

Admin reviews and approves/rejects documents.

System checks if all required documents are approved.

If yes, marks student as verified (isVerified = true).

Progress Tracking

Teacher updates memorization progress (page, surah).

Student can set and track learning goals.

Session Management

Student can see upcoming sessions.

Student can enroll in Halakat and view enrollments.





*/