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
        "student_id",
        "birth_certificate",
        "guardian_id",
        "teaching_license",
        "qualification_certificate",
        "tajweed_certification",
        "academy_license",
        "commercial_registration",
      ],
    },

    // File management
    fileUrl: { type: String, required: true },
    fileHash: { type: String, required: true },

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

export default mongoose.model("Document", documentSchema);

/*

1. Fields 
Field	What It Means
ownerType	-> Who owns this document? (student, teacher, or academy)
ownerId ->	The ID of the owner (links to a student, teacher, or academy)
docType	-> What kind of document is this? (ID, license, certificate, etc.)
fileUrl	->Where is the file stored? (link to the file)
fileHash	->A unique code (SHA-256) for the file to check if it’s been changed
status	->Is the document pending, approved, rejected, or expired? (default: pending)
reviewer	->Who reviewed this document? (required if status is not pending)
reviewDate	->When was this document reviewed? (required if status is not pending)
rejectionReason	->Why was this document rejected? (required if status is rejected)
issueDate ->	When was this document issued? (optional)
expiryDate->	When does this document expire? (optional)
_________
2. Virtuals
____________
Virtual	What It Does
owner	Gets the owner’s full profile (student, teacher, or academy)
isExpired	Checks if the document is expired (true if expiryDate is past today)
______________
3. Indexes (For Fast Searching)
______________
ownerType + ownerId: Quickly find all documents for a specific student, teacher, or academy.

status: Quickly find all pending, approved, or rejected documents.

docType: Quickly find all documents of a certain type (e.g., all teaching licenses).
______________
4. Workflow (How Does It Work?)
________
Here’s a simple step-by-step flow:

Step 1: Upload a Document
Who: A student, teacher, or academy uploads a document (like an ID or license).

What happens: The document is saved with status = pending.

Step 2: Admin Reviews the Document
Who: An admin (reviewer) checks the document.

What happens:

If approved: The admin sets status = approved, adds their ID (reviewer), and sets reviewDate.

If rejected: The admin sets status = rejected, adds their ID, sets reviewDate, and adds a rejectionReason.

Step 3: System Updates Owner’s Verification Status
What happens: After the document is approved or rejected, the system checks if the owner (student, teacher, or academy) has all required documents approved.

If all required documents are approved: The owner’s isVerified is set to true.

If not: The owner’s isVerified stays false (or goes to pending).

Step 4: Access and Security
File security: The fileHash ensures the file hasn’t been tampered with.

Expiry check: The system checks if the document is expired (isExpired virtual).

5. Simple Example
A teacher uploads a teaching license:

Document is saved:

js
{
  ownerType: "teacher",
  ownerId: "123...",
  docType: "teaching_license",
  fileUrl: "https://storage.com/license.pdf",
  fileHash: "a1b2c3...",
  status: "pending"
}
Admin reviews and approves:

js
{
  status: "approved",
  reviewer: "admin123",
  reviewDate: "2025-06-25"
}
System checks if all required documents are approved:

If yes: Teacher is marked as verified (isVerified = true).

If no: Teacher remains unverified.


*/