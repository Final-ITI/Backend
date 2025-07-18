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
    },

    experience: {
      type: Number,
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
    real_gender: {
      type: String,
      enum: ["male", "female", "ذكر", "أنثى"],
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    // national ID
    id_number: {
      type: String,
      unique: true,
      maxlength: 14,
      minlength: 14,
    },
    // Pricing (for freelance teachers)
    sessionPrice: {
      // private
      type: String,
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
  return ["national_id_front", "national_id_back", "certificates"];
});

// Document relationship
teacherSchema.virtual("documents", {
  ref: "Document",
  localField: "_id",
  foreignField: "ownerId",
  match: { ownerType: "teacher" },
});

// Indexes for fast queries
teacherSchema.index({ userId: 1 });
teacherSchema.index({ academyId: 1 });
teacherSchema.index({ teacherType: 1 });
teacherSchema.index({ isVerified: 1 });
teacherSchema.index({ verificationStatus: 1 });
teacherSchema.index({ specialization: 1 });

// Compound indexes for search
teacherSchema.index({ specialization: 1, "performance.rating": -1 });
// teacherSchema.index({ isActive: 1, "performance.rating": -1 });

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

const Teacher =
  mongoose.models.Teacher || mongoose.model("Teacher", teacherSchema);
export default Teacher;

