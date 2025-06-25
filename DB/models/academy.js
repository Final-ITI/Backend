import mongoose from 'mongoose'
const Schema = mongoose.Schema;

const academySchema = new Schema(
  {
    // Basic Academy Information
    academyName: {
      type: String,
      required: [true, "Academy name is required"],
      trim: true,
      maxlength: [100, "Academy name cannot exceed 100 characters"],
    },
    academyNameArabic: {
      type: String,
      required: [true, "Academy name in Arabic is required"],
      trim: true,
      maxlength: [100, "Academy name in Arabic cannot exceed 100 characters"],
    },

    // Reference to User (Academy Administrator)
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    // Contact Information
    email: {
      type: String,
      required: [true, "Academy email is required"],
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Academy phone is required"],
      match: [
        /^[+]?[0-9\s\-\(\)]{10,15}$/,
        "Please provide a valid phone number",
      ],
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+/, "Please provide a valid website URL"],
    },

    // Address
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true, default: "Saudi Arabia" },
      postalCode: { type: String, required: true },
    },

    // Academy Details
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    establishedYear: {
      type: Number,
      min: [1900, "Established year must be after 1900"],
      max: [
        new Date().getFullYear(),
        "Established year cannot be in the future",
      ],
    },

    // Licensing and Verification
    licenseNumber: String,
    licenseType: {
      type: String,
      enum: ["government", "private", "religious_authority", "other"],
    },
    licenseExpiryDate: Date,

    // Academy Settings and Preferences
    settings: {
      theme: {
        primaryColor: { type: String, default: "#2E8B57" },
        secondaryColor: { type: String, default: "#4682B4" },
        logo: String,
        favicon: String,
      },
      allowMixedGenderClasses: { type: Boolean, default: false },
      maxStudentsPerTeacher: { type: Number, default: 20, min: 1, max: 100 },
      defaultSessionDuration: { type: Number, default: 60, min: 15, max: 300 },
      features: {
        enableOnlineClasses: { type: Boolean, default: true },
        enablePayments: { type: Boolean, default: true },
        enableCertificates: { type: Boolean, default: true },
        enableProgress_tracking: { type: Boolean, default: true },
        enableParentAccess: { type: Boolean, default: false },
      },
      notifications: {
        emailNotifications: { type: Boolean, default: true },
        smsNotifications: { type: Boolean, default: false },
        pushNotifications: { type: Boolean, default: true },
      },
    },

    // Subscription and Billing (SaaS)
    subscription: {
      plan: {
        type: String,
        enum: ["trial", "basic", "premium", "enterprise"],
        default: "trial",
      },
      status: {
        type: String,
        enum: ["active", "inactive", "suspended", "cancelled"],
        default: "active",
      },
      startDate: { type: Date, default: Date.now },
      endDate: Date,
      maxTeachers: { type: Number, default: 5 },
      maxStudents: { type: Number, default: 50 },
    },

    // Statistics and Metrics
    stats: {
      totalTeachers: { type: Number, default: 0 },
      totalStudents: { type: Number, default: 0 },
      totalSessions: { type: Number, default: 0 },
      activeStudents: { type: Number, default: 0 },
    },

    // Status
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verificationNotes: String,

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for active teachers count
academySchema.virtual("activeTeachersCount", {
  ref: "Teacher",
  localField: "_id",
  foreignField: "academyId",
  count: true,
  match: { isActive: true },
});

// Virtual for active students count
academySchema.virtual("activeStudentsCount", {
  ref: "Student",
  localField: "_id",
  foreignField: "academyId",
  count: true,
  match: { isActive: true },
});

// Virtual for all documents uploaded by this academy
academySchema.virtual("documents", {
  ref: "Document",
  localField: "_id",
  foreignField: "ownerId",
  match: { ownerType: "academy" },
});

// Virtual for required documents for academy verification
academySchema.virtual("requiredDocuments").get(function () {
  return ["academy_license", "commercial_registration"];
});

// Indexes
academySchema.index({ userId: 1 });
academySchema.index({ email: 1 });
academySchema.index({ academyName: 1 });
academySchema.index({ isActive: 1, isVerified: 1 });
academySchema.index({ "subscription.status": 1 });
academySchema.index({ verificationStatus: 1 });

// Pre-save middleware to update timestamp
academySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check subscription limits
academySchema.methods.canAddTeacher = function () {
  return this.stats.totalTeachers < this.subscription.maxTeachers;
};

academySchema.methods.canAddStudent = function () {
  return this.stats.totalStudents < this.subscription.maxStudents;
};

// Instance method to update stats
academySchema.methods.updateStats = async function () {
  const Teacher = mongoose.model("Teacher");
  const Student = mongoose.model("Student");

  const [teacherCount, studentCount, activeStudentCount] = await Promise.all([
    Teacher.countDocuments({ academyId: this._id, isActive: true }),
    Student.countDocuments({ academyId: this._id }),
    Student.countDocuments({ academyId: this._id, isActive: true }),
  ]);

  this.stats.totalTeachers = teacherCount;
  this.stats.totalStudents = studentCount;
  this.stats.activeStudents = activeStudentCount;

  return this.save();
};

export default mongoose.model("Academy", academySchema);

/*
Fields
Basic Info: Academy name (English/Arabic), admin user, contact info, address, description, year established.

Licensing: License number, type, expiry date.

Settings: Theme, class rules, session duration, feature toggles, notifications.

Subscription: Plan, status, limits, dates.

Stats: Counts of teachers, students, sessions.

Status: Active, verified, verification status, notes.

Timestamps: Created/updated dates.

Virtuals
activeTeachersCount: Counts active teachers.

activeStudentsCount: Counts active students.

documents: Gets all documents uploaded for this academy.

requiredDocuments: Lists required documents for verification (license, commercial registration).

Indexes
Fast searching: By admin user, email, name, status, subscription, verification.

Methods
canAddTeacher/Student: Checks if academy can add more teachers/students.

updateStats: Updates teacher/student counts.

Workflow
Academy is created: Fills in details, uploads required documents.

Admin reviews documents: Updates status to approved/rejected.

System checks required documents: If all are approved, marks academy as verified.

Academy is active: Can manage teachers, students, and sessions.

*/
