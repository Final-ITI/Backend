import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    // Basic Information
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    phone: {
      type: String,
      // required: [true, "Phone number is required"],
      match: [
        /^[+]?[0-9\s\-\(\)]{10,15}$/,
        "Please provide a valid phone number",
      ],
    },

    // User Type and Role
    userType: {
      type: String,
      required: [true, "User type is required"],
      enum: {
        values: ["superadmin", "academy", "teacher", "student"],
        message:
          "User type must be one of: superadmin, academy, teacher, student",
      },
    },

    // Gender (cultural requirement)
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: {
        values: ["male", "female"],
        message: "Gender must be either male or female",
      },
    },

    // Address Information
    address: String,
    country: { type: String, default: "Egypt" },

    activationCodeEmail: String,

    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Profile Information
    profilePicture: {
      type: String,
      default: null,
    },
    // Authentication & Security
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordResetIsVerified: { type: Boolean, default: false },
    passwordChangedAt: Date,
    // Login attempts and account lockout
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,

    // Multi-tenant Support (for academy affiliation)
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Academy",
      default: null, // null for superadmin and freelance teachers
    },

    // Timestamps
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    transform: function (doc, ret) {
      // Remove sensitive fields from the output
      ret.id = ret._id; // Add id field
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Do not expose password
      delete ret.emailVerificationToken; // Do not expose verification token
      delete ret.passwordResetToken; // Do not expose reset token
      delete ret.lockUntil; // Do not expose lockUntil
      return ret;
    },
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ tenantId: 1, userType: 1 });
userSchema.index({ verificationStatus: 1 });
// userSchema.index({ isActive: 1, isVerified: 1 });

// Pre-save middleware for password hashing
userSchema.pre("save", async function (next) {
  // Only run if password is modified
  if (!this.isModified("password")) return next();

  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Set passwordChangedAt for new users
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change
  }

  next();
});

// Pre-save middleware to update timestamp
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Post-save middleware to create Teacher or Student records
userSchema.post("save", async function (doc) {
  // Only create profile records for new users
  if (doc.isNew !== false) {
    try {
      if (doc.userType === "teacher") {
        const Teacher = mongoose.model("Teacher");
        await Teacher.create({
          userId: doc._id,
        });
      } else if (doc.userType === "student") {
        const Student = mongoose.model("Student");
        await Student.create({
          user: doc._id,
          profileCompleted: false, // Will require profile completion later
        });
      }
    } catch (error) {
      throw new Error(
        `Error creating ${doc.userType} profile: ${error.message}`
      );
    }
  }
});

// Instance method to check password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to handle login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // If we hit max attempts and it's not locked already, lock the account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // Lock for 2 hours
  }

  return this.updateOne(updates);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
