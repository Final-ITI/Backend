import mongoose from "mongoose";
import ApiError from "../../src/utils/apiError.js";
import { isHalakaEnrollmentClosed } from "../../src/utils/dateUtils.js";
const Schema = mongoose.Schema;

const enrollmentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true, // Important for quick lookups of a student's enrollments
    },

    halaka: {
      type: Schema.Types.ObjectId,
      ref: "Halaka",
      required: true,
    },

    status: {
      type: String,
      required: true,
      enum: [
        "pending_action", // Private: Teacher invited student, waiting for student to accept/reject.
        "pending_payment", // Group: Student initiated enrollment. Private: Student accepted invite. Waiting for payment.
        "active", // Payment complete, student is active in the halaka.
        "no_balance", // Private only: Student's session package has run out.
        "completed", // Halaka end date has passed.
        "cancelled_by_student", // Student explicitly cancelled their enrollment.
        "cancelled_by_teacher", // Teacher cancelled the enrollment.
      ],
      default: "pending_action",
    },

    sessionsRemaining: {
      type: Number,
      default: 0,
      min: 0,
    },
    /**
     * @desc    A snapshot of key halaka and price data at the moment of enrollment.
     * This is for historical accuracy and invoicing, ensuring that even if
     * the original halaka or teacher's price changes, this record remains correct.
     */
    snapshot: {
      halakaTitle: {
        type: String,
        required: true,
      },
      // For group halaqas
      pricePerStudent: {
        type: Number,
      },
      // For private halaqas (package purchases)
      pricePerSession: {
        type: Number,
      },
      currency: {
        type: String,
        required: true,
        default: "EGP",
      },
    },
    // Paymob
    paymobOrderId: {
        type: Number,
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- INDEXES ---
enrollmentSchema.index({ student: 1, halaka: 1 }, { unique: true });

// --- VIRTUALS ---
// Virtuals are not stored in the database but are computed on the fly.

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

enrollmentSchema.virtual("isPrivate").get(function () {
  // This requires the 'halakaDetails' virtual to be populated first.
  return this.halakaDetails && this.halakaDetails.halqaType === "private";
});

// --- MIDDLEWARE ---
// Consolidated pre-save hook for all validations
enrollmentSchema.pre("save", async function (next) {
  // Only run these validations for new documents
  if (this.isNew) {
    try {
      // 1. Check for existing enrollment
      const existingEnrollment = await this.constructor.findOne({
        student: this.student,
        halaka: this.halaka,
      });
      if (existingEnrollment) {
        // Use standard Error here
        return next(
          new ApiError("You are already enrolled in this halaka.", 400)
        );
      }

      // 2. Fetch Halaka details for further validation
      const Halaka = mongoose.model("Halaka");
      const halaka = await Halaka.findById(this.halaka);
      if (!halaka) {
        return next(new ApiError("Halaka not found", 404));
      }

      // 3. Check if enrollment is still allowed (start date hasn't passed)
      if (isHalakaEnrollmentClosed(halaka.schedule)) {
        return next(
          new ApiError(
            "Cannot enroll in this halaka. The start date and time has already passed.",
            400
          )
        );
      }

      // // 4. Business logic validation for group halaqas
      // if (halaka.halqaType === "halqa") {
      //   if (halaka.currentStudents >= halaka.maxStudents) {
      //     return next(new ApiError("This halaka is full.", 400));
      //   }
      //   // For group halaqas, add student to the halaka's students array
      //   await Halaka.findByIdAndUpdate(this.halaka, {
      //     $inc: { currentStudents: 1 },
      //     $addToSet: { students: this.student },
      //   });
      // } else if (halaka.halqaType === "private") {
      //   // Logic for private halaqas
      // }
      // Note: We don't need to check if the type is 'private' because the controller
      // for private invitations will handle that logic separately.
    } catch (error) {
      return next(error);
    }
  }
  next();
});

enrollmentSchema.post("save", async function (doc, next) {
  // We only care about when an enrollment status changes, not on initial creation.
  if (doc.isModified("status") && doc.status === "active") {
    try {
      const Halaka = mongoose.model("Halaka");
      const Teacher = mongoose.model("Teacher");
      const Student = mongoose.model("Student"); // Assuming you have a Student model

      const halaka = await Halaka.findById(doc.halaka);
      if (!halaka) return next();

      // Increment the student count in the halaka
      await Halaka.findByIdAndUpdate(doc.halaka, {
        $inc: { currentStudents: 1 },
      });

      // Increment the active students count for the teacher
      await Teacher.findByIdAndUpdate(halaka.teacher, {
        $inc: { "performance.activeStudents": 1 },
      });
    } catch (error) {
      console.error("Error in enrollment post-save hook:", error);
      // We don't block the main operation, just log the error.
    }
  }
  next();
});

// --- INSTANCE METHODS ---

/**
 * Check if the halaka is full (for group halakas)
 * @returns {Promise<boolean>} True if halaka is full, false otherwise
 */
enrollmentSchema.methods.isHalakaFull = async function () {
  const Halaka = mongoose.model("Halaka");
  const halaka = await Halaka.findById(this.halaka);

  if (!halaka) {
    throw new ApiError("Halaka not found", 404);
  }

  // Only check capacity for group halakas
  if (halaka.halqaType === "halqa") {
    return halaka.currentStudents >= halaka.maxStudents;
  }

  return false; // Private halakas don't have capacity limits
};

/**
 * Validate if enrollment can be created
 * @returns {Promise<{isValid: boolean, error?: string}>}
 */
enrollmentSchema.methods.validateEnrollment = async function () {
  const Halaka = mongoose.model("Halaka");
  const halaka = await Halaka.findById(this.halaka);

  if (!halaka) {
    return { isValid: false, error: "Halaka not found" };
  }

  // Check if it's a group halaka (this endpoint is for group halakas only)
  if (halaka.halqaType !== "halqa") {
    return { isValid: false, error: "This endpoint is only for group halakas" };
  }

  // Check if halaka is full
  if (halaka.currentStudents >= halaka.maxStudents) {
    return { isValid: false, error: "This halaka is full" };
  }

  return { isValid: true };
};

const Enrollment =
  mongoose.models.Enrollment || mongoose.model("Enrollment", enrollmentSchema);
export default Enrollment;
