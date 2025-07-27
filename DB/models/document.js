import mongoose from "mongoose";
const Schema = mongoose.Schema;

const documentSchema = new Schema(
  {
    // Core ownership
    ownerType: {
      type: String,
      enum: ["student", "teacher", "academy"],
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "ownerType",
    },
    // Document classification
    docType: {
      type: String,
      required: true,
      enum: [
        // Teacher & General Docs
        "national_id_front",
        "national_id_back",
        "certificates", // General term for ijazah, etc.
        "qualification_certificate",

        // Student Docs
        "student_id",
        "birth_certificate",

        // Other types you had before
        "guardian_id",
        "teaching_license",
        "tajweed_certification",
        "academy_license",
        "commercial_registration",
      ],
    },

    // File management
    fileUrl: { type: String, required: true },
    publicId: { type: String, required: true }, // Add this line
    fileHash: { type: String },
    // AI processing results
    ai: {
      fullName: {
        type: String,
      },
      id_number: {
        type: String,
        unique: true,
        maxlength: 14,
        minlength: 14,
      },
      gender: {
        type: String,
        enum: ["male", "female", "ذكر", "أنثى"],
      },
      expiryDate: {
        type: Date,
      },
      isExpired: {
        type: Boolean,
      },
      address: {
        type: String,
      },
    },
    // Verification lifecycle (admin-controlled)
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.status !== "pending"; // Required when status changes
      },
    },
    reviewDate: {
      type: Date,
      required: function () {
        return this.status !== "pending"; // Required when status changes
      },
    },
    rejectionReason: {
      type: String,
      required: function () {
        return this.status === "rejected"; // Required for rejections
      },
    },

    // Metadata
    issueDate: Date,
    expiryDate: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
documentSchema.virtual("owner", {
  ref: function () {
    return this.ownerType;
  },
  localField: "ownerId",
  foreignField: "_id",
  justOne: true,
});

documentSchema.virtual("isExpired").get(function () {
  return this.expiryDate && new Date() > this.expiryDate;
});

// Indexes
documentSchema.index({ ownerType: 1, ownerId: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ docType: 1 });

// Admin verification middleware
documentSchema.pre("save", function (next) {
  // Prevent non-admin status changes
  if (this.isModified("status") && this.status !== "pending") {
    if (!this.reviewer) {
      return next(new Error("Reviewer ID is required for verification"));
    }
    if (!this.reviewDate) {
      this.reviewDate = new Date();
    }
  }
  next();
});

// Auto-verification after admin approval
documentSchema.post("save", async function (doc) {
  if (doc.status === "approved" || doc.status === "rejected") {
    await updateOwnerVerificationStatus(doc.ownerType, doc.ownerId);
  }
});

// Helper: Update owner verification status
const updateOwnerVerificationStatus = async (ownerType, ownerId) => {
  let OwnerModel;
  switch (ownerType) {
    case "teacher":
      OwnerModel = mongoose.model("Teacher");
      break;
    case "student":
      OwnerModel = mongoose.model("Student");
      break;
    case "academy":
      OwnerModel = mongoose.model("Academy");
      break;
    default:
      return;
  }

  const owner = await OwnerModel.findById(ownerId);
  if (!owner) return;

  const requiredDocs = owner.requiredDocuments || [];
  if (requiredDocs.length === 0) return;

  const docs = await mongoose.model("Document").find({
    ownerType,
    ownerId,
    status: "approved",
    $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
  });

  const hasAllRequired = requiredDocs.every((rdoc) =>
    docs.some((d) => d.docType === rdoc)
  );

  owner.isVerified = hasAllRequired;
  owner.verificationStatus = hasAllRequired ? "approved" : "pending";
  await owner.save();
};
const Document =
  mongoose.models.Document || mongoose.model("Document", documentSchema);
export default Document;

