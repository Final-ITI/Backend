import mongoose from "mongoose";
const Schema = mongoose.Schema;

const studentSchema = new Schema(
  {
    // Reference to base User (required)
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Student-specific fields
    birthDate: {
      type: Date,
      // required: true,
    },
    guardianName: {
      type: String,
      // required: function () {
      //   return this.isMinor();
      // },
    },
    guardianPhone: {
      type: String,
      // required: function () {
      //   return this.isMinor();
      // },
      match: [
        /^[+]?[0-9\s\-\(\)]{10,15}$/,
        "Please provide a valid phone number",
      ],
    },

    // Document verification (complements User docs)
    studentIdDocument: {
      type: String, // File path or URL
      // required: true,
    },
    guardianIdDocument: {
      type: String, // File path or URL
      // required: function () {
      //   return this.isMinor();
      // },
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
// studentSchema.virtual("age").get(function () {
//   const diff = Date.now() - this.birthDate.getTime();
//   return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
// });

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
// studentSchema.methods.checkVerification = async function () {
//   const requiredDocs = this.requiredDocuments;
//   const approvedDocs = await mongoose.model("Document").find({
//     ownerId: this._id,
//     ownerType: "student",
//     status: "approved",
//   });

//   const hasAllDocs = requiredDocs.every((rdoc) =>
//     approvedDocs.some((adoc) => adoc.docType === rdoc)
//   );

//   if (hasAllDocs) {
//     this.isVerified = true;
//     this.verificationStatus = "approved";
//     await this.save();
//   }
// };

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

// studentSchema.virtual("verificationStatus").get(function () {
//   return this.user.verificationStatus; // From User model
// });

// Document verification middleware
studentSchema.pre("save", function (next) {
  // Auto-set required documents for minors
  if (this.isMinor && !this.guardianIdDocument) {
    next(new Error("Guardian ID document is required for minors"));
  }
  next();
});

// Indexes
studentSchema.index({ userId: 1 });
studentSchema.index({ birthDate: 1 });
studentSchema.index({ "learningGoals.targetCompletion": 1 });

const Student =
  mongoose.models.Student || mongoose.model("Student", studentSchema);
export default Student;
