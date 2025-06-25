import mongoose from "mongoose";
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
      required: [true, "Phone number is required"],
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

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Document Verification
    documentsUploaded: {
      type: Boolean,
      default: false,
    },
    documentsVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Profile Information
    profilePicture: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },

    // Authentication & Security
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
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
userSchema.index({ isActive: 1, isVerified: 1 });

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
export default mongoose.model("User", userSchema);

/*

Basic Information
firstName, lastName: Required for personalization and identification.

email: Required, unique, validated. Used for login, notifications, and as a unique identifier.

password: Required, hashed, hidden in queries. Used for authentication.

phone: Required, validated. Used for contact and notifications.

User Type and Role
userType: Required, enum. Controls access and permissions (superadmin, academy, teacher, student).

gender: Required, enum. Ensures gender-based access as per cultural requirements.

Address Information
address: Simple string. Used for contact or verification.

country: Defaults to "Saudi Arabia". Used for localization.

Account Status
isActive: Default true. Used to deactivate users if needed.

isVerified: Default false. Indicates if user is verified by admin.

isEmailVerified: Default false. Indicates if email is verified.

Document Verification
documentsUploaded: Default false. Indicates if user uploaded documents.

documentsVerified: Default false. Indicates if documents are verified by admin.

verificationStatus: Enum (pending, approved, rejected). Tracks document review status.

Profile Information
profilePicture: Optional. Used for user profile.

bio: Optional, maxlength 500. Short user description.

Authentication & Security
emailVerificationToken, emailVerificationExpires: Used for email verification.

passwordResetToken, passwordResetExpires: Used for password reset.

passwordChangedAt: Tracks password changes for security.

loginAttempts: Tracks failed login attempts.

lockUntil: Locks account after too many failed attempts.

Multi-tenant Support
tenantId: References Academy. Used to link users to their academy (null for superadmin and freelancers).

Timestamps
lastLogin: Tracks last login time.

timestamps: true: Adds createdAt and updatedAt automatically.



_______________
Indexes:
_______________
{ email: 1 }	Fast lookup by email (login, uniqueness check)
{ userType: 1 }	Fast filtering by user type (e.g., list all teachers)
{ tenantId: 1, userType: 1 }	Fast filtering by academy and user type (e.g., all students in academy)
{ verificationStatus: 1 }	Fast filtering by verification status (e.g., pending approvals)
{ isActive: 1, isVerified: 1 }	Fast filtering by active/verified users

_______________
 Virtuals
_______________
fullName: Combines firstName and lastName for display.

isLocked: Checks if account is locked due to failed login attempts.

_______________
Methods
_______________
pre-save middleware: Hashes password before saving.

correctPassword: Checks if password matches.

changedPasswordAfter: Checks if password changed after JWT was issued (for security).

incLoginAttempts: Handles login attempts and locks account after too many failures.






_____________
User Flow
_____________
1. Registration
User fills in basic info (name, email, phone, password, gender, address).

Selects user type (superadmin, academy, teacher, student).

Uploads documents if required (e.g., ID, license).

Account is created with default statuses (isActive: true, isVerified: false, documentsUploaded: false, verificationStatus: pending).

2. Verification
Admin reviews documents and updates verificationStatus.

If approved: isVerified and documentsVerified are set to true.

If rejected: User is notified to re-upload documents.

3. Login
User logs in with email and password.

Login attempts are tracked.

If too many failures, account is locked for 2 hours.

4. Profile Management
User can update profile info (bio, profile picture).

Can change password (triggers passwordChangedAt).

5. Password Reset
User requests password reset.

Reset token is generated and sent to email.

User resets password using token.

6. Multi-tenancy
If user is academy, teacher, or student, tenantId links to their academy.

Superadmin and freelance teachers have tenantId as null.

7. Account Status
Admin can deactivate user (isActive: false).

User can be locked out for security reasons.





*/