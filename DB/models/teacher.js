import mongoose from "mongoose";
const Schema = mongoose.Schema;

const teacherSchema = new Schema(
  {
    // Reference to User
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    // Academy Association (null for freelance teachers)
    academyId: {
      type: Schema.Types.ObjectId,
      ref: "Academy",
      default: null,
    },
    // Teacher Type
    teacherType: {
      type: String,
      enum: ["freelance", "academy_employed"],
      required: [true, "Teacher type is required"],
      default: "freelance",
    },
    halakat: [
      {
        type: Schema.Types.ObjectId,
        ref: "Halaka",
      },
    ],
    // Professional Information
    skills: {
      type: String,
      required: [true, "Skills is required"],
    },
    experience: {
      type: Number,
      required: [true, "Experience is required"],
      min: [0, "Experience cannot be negative"],
      max: [50, "Experience cannot exceed 50 years"],
    },
    specialization: [
      {
        type: String,
        enum: [
          "quran_memorization",
          "quran_recitation",
          "tajweed",
          "arabic_language",
          "fiqh",
          "hadith",
          "aqeedah",
        ],
      },
    ],
    bio: {
      type: String,
      required: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    id_number: {
      type: String,
      required: true,
      maxlength: 14,
      minlength: 14,
    },
    // Pricing (for freelance teachers)
    sessionPrice: { // private
      type: String,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "EGP",
    },

    bankingInfo: {
      bankName: String,
      accountNumber: String,
      iban: String,
      swiftCode: String,
      accountHolderName: String,
      // This should be encrypted in production
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
    // Performance Metrics
    performance: {
      rating: {
        type: Number,
        min: [0, "Rating cannot be less than 0"],
        max: [5, "Rating cannot exceed 5"],
        default: 0,
      },
      totalRatings: {
        type: Number,
        default: 0,
      },
      totalSessions: {
        type: Number,
        default: 0,
      },
      completedSessions: {
        type: Number,
        default: 0,
      },
      cancelledSessions: {
        type: Number,
        default: 0,
      },
      totalStudents: {
        type: Number,
        default: 0,
      },
      activeStudents: {
        type: Number,
        default: 0,
      },
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

// Virtual for required documents
teacherSchema.virtual("requiredDocuments").get(function () {
  return ["teaching_license", "qualification_certificate"];
});

// Document relationship
teacherSchema.virtual("documents", {
  ref: "Document",
  localField: "_id",
  foreignField: "ownerId",
  match: { ownerType: "teacher" },
});

// Auto-verification method
teacherSchema.methods.checkVerification = async function () {
  const requiredDocs = this.requiredDocuments;
  const approvedDocs = await mongoose.model("Document").find({
    ownerId: this._id,
    ownerType: "teacher",
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
// Indexes for fast queries
teacherSchema.index({ userId: 1 });
teacherSchema.index({ academyId: 1 });
teacherSchema.index({ teacherType: 1 });
teacherSchema.index({ isActive: 1, isVerified: 1 });
teacherSchema.index({ verificationStatus: 1 });
teacherSchema.index({ specialization: 1 });

// Compound indexes for search
teacherSchema.index({ specialization: 1, "performance.rating": -1 });
teacherSchema.index({ isActive: 1, "performance.rating": -1 });

// Virtual for teacher's full profile from User
teacherSchema.virtual("profile", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for academy details
teacherSchema.virtual("academy", {
  ref: "Academy",
  localField: "academyId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for students count
teacherSchema.virtual("studentsCount", {
  ref: "Student",
  localField: "_id",
  foreignField: "teacherId",
  count: true,
});

// Instance method to check gender compatibility with student
teacherSchema.methods.canTeachStudent = function (studentGender) {
  const pref = this.teachingPreferences.preferredStudentGender;
  if (pref === "any") return true;
  if (pref === "same_gender_only") return true;
  if (pref === "male_only") return studentGender === "male";
  if (pref === "female_only") return studentGender === "female";
  return false;
};

export default mongoose.model("Teacher", teacherSchema);

/*
Core Field
_______________________
User & Academy References

userId: Links to base user account (required)

academyId: Academy affiliation (null for freelancers)

Professional Identity

teacherType: Freelance or academy-employed

qualification: Teaching credentials (max 200 chars)

experience: Years of experience (0-50)

specialization: Quranic disciplines

Teaching Preferences

preferredStudentGender: Gender-based teaching rules

ageGroups: Supported student age brackets

classTypes: Teaching formats (individual/group/online)

Financial Configuration

pricing: Session-based pricing for freelancers

bankingInfo: Encrypted bank details with verification

Performance Metrics

Tracks ratings, sessions, students with 8+ quantitative metrics

Status Management

isActive: Account activation

isVerified: Admin approval

verificationStatus: 4-state workflow



____________
Virtuals
_____________
profile

Purpose: Populates the linked User profile data

Functionality: Provides access to the teacher's base user details (name, email, etc.) without duplicating data

Usage: teacher.profile returns full user object

academy

Purpose: Populates academy details

Functionality: Retrieves complete academy information for academy-employed teachers

Usage: teacher.academy returns academy document

studentsCount

Purpose: Counts active students

Functionality: Dynamically calculates number of students assigned to teacher

Usage: teacher.studentsCount returns integer


____________
Methods
____________
canTeachStudent(studentGender)

Purpose: Enforces gender-based teaching rules

Parameters: studentGender ("male" or "female")

________________
user flow
________________
1. Registration & Profile Setup
Step 1: User registers on the platform and selects the “Teacher” role.

Step 2: Teacher fills out professional information (qualifications, experience, specialization).

Step 3: Teacher sets teaching preferences (student gender, age groups, class types).

Step 4: If freelance, teacher enters pricing and banking details.

Step 5: Teacher uploads required documents (ID, certificates, etc.) for verification.

2. Verification & Activation
Step 6: Admin reviews the teacher’s profile and documents.

Step 7: If approved, teacher’s account is activated and marked as “verified”.

Step 8: If rejected, teacher receives feedback and is prompted to update or resubmit information.

3. Teaching & Student Management
Step 9: Teacher’s profile becomes visible to students (according to preferences and status).

Step 10: Students book sessions with the teacher.

Step 11: Teacher conducts sessions (online or offline).

Step 12: Teacher updates session status (completed, cancelled).

Step 13: Teacher receives feedback and ratings from students.

4. Performance & Reporting
Step 14: Platform automatically updates performance metrics (sessions, ratings, students).

Step 15: Teacher views performance dashboard and feedback.

5. Financial Management (Freelance Teachers)
Step 16: Freelance teacher sets session prices and updates banking info.

Step 17: Platform processes payments for completed sessions.

Step 18: Freelance teacher receives payouts to verified bank account.

6. Profile & Availability Management
Step 19: Teacher updates availability and preferences as needed.

Step 20: Teacher renews qualifications or uploads new certificates when required.

7. Account Status & Compliance
Step 21: Teacher’s status is monitored by admin (active, suspended, terminated).

Step 22: Teacher can appeal or update information if account is suspended.





*/
