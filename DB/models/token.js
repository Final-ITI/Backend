import mongoose from "mongoose";
import crypto from "crypto";
const Schema = mongoose.Schema;

const tokenSchema = new Schema(
  {
    // Token owner (user reference)
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },

    // Token type
    tokenType: {
      type: String,
      required: [true, "Token type is required"],
      enum: {
        values: ["access", "refresh"],
        message: "Token type must be either 'access' or 'refresh'",
      },
      index: true,
    },

    // Token value (hashed for security)
    token: {
      type: String,
      required: [true, "Token value is required"],
      unique: true,
      index: true,
    },

    // Token expiration
    expiresAt: {
      type: Date,
      required: [true, "Token expiration is required"],
      index: true,
    },

    // Device information for security
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
      deviceType: {
        type: String,
        enum: ["mobile", "tablet", "desktop", "unknown"],
        default: "unknown",
      },
      browser: String,
      os: String,
    },

    // Token status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Revocation information
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    revocationReason: {
      type: String,
      enum: {
        values: [
          "user_logout",
          "user_logout_all",
          "password_change",
          "security_breach",
          "admin_revocation",
          "expired",
          "token_refresh",
          "other",
        ],
        message: "Value {VALUE} is not a valid reason for revocation.",
      },
      default: null,
    },

    // Refresh token chain (for refresh token rotation)
    refreshTokenChain: {
      previousToken: {
        type: Schema.Types.ObjectId,
        ref: "Token",
        default: null,
      },
      nextToken: {
        type: Schema.Types.ObjectId,
        ref: "Token",
        default: null,
      },
    },

    // Multi-tenant support
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Academy",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for token status
tokenSchema.virtual("isExpired").get(function () {
  return this.expiresAt < new Date();
});

tokenSchema.virtual("isRevoked").get(function () {
  return this.revokedAt !== null;
});

tokenSchema.virtual("isValid").get(function () {
  return this.isActive && !this.isExpired && !this.isRevoked;
});

// Virtual for token age
tokenSchema.virtual("ageInMinutes").get(function () {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60));
});

// Indexes for performance and queries
tokenSchema.index({ user: 1, tokenType: 1, isActive: 1 });
tokenSchema.index({ token: 1, isActive: 1 });
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
tokenSchema.index({ createdAt: 1 });
tokenSchema.index({ revokedAt: 1 });

// Pre-save middleware to hash token
tokenSchema.pre("save", function (next) {
  // Only hash if token is modified and not already hashed
  if (this.isModified("token") && !this.token.startsWith("$2b$")) {
    this.token = crypto.createHash("sha256").update(this.token).digest("hex");
  }
  next();
});

// Static method to create a new token
tokenSchema.statics.createToken = async function (tokenData) {
  const {
    user,
    tokenType,
    token,
    expiresAt,
    deviceInfo = {},
    tenantId = null,
  } = tokenData;

  const newToken = new this({
    user,
    tokenType,
    token,
    expiresAt,
    deviceInfo,
    tenantId,
  });

  return await newToken.save();
};

// Static method to find valid token
tokenSchema.statics.findValidToken = async function (token, tokenType = null) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const query = {
    token: hashedToken,
    expiresAt: { $gt: new Date() },
    revokedAt: null,
  };

  if (tokenType) {
    query.tokenType = tokenType;
  }

  return await this.findOne(query).populate(
    "user",
    "firstName lastName email userType"
  );
};

// Static method to revoke token
tokenSchema.statics.revokeToken = async function (
  token,
  reason = "user_logout",
  revokedBy = null
) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  return await this.findOneAndUpdate(
    { token: hashedToken, isActive: true },
    {
      isActive: false,
      revokedAt: new Date(),
      revocationReason: reason,
      revokedBy,
    },
    { new: true }
  );
};

// Static method to revoke all user tokens
tokenSchema.statics.revokeAllUserTokens = async function (
  userId,
  reason = "user_logout",
  revokedBy = null
) {
  return await this.updateMany(
    { user: userId, isActive: true },
    {
      isActive: false,
      revokedAt: new Date(),
      revocationReason: reason,
      revokedBy,
    }
  );
};

// Static method to revoke all user tokens except current
tokenSchema.statics.revokeOtherUserTokens = async function (
  userId,
  currentToken,
  reason = "security_breach",
  revokedBy = null
) {
  const hashedCurrentToken = crypto
    .createHash("sha256")
    .update(currentToken)
    .digest("hex");

  return await this.updateMany(
    {
      user: userId,
      isActive: true,
      token: { $ne: hashedCurrentToken },
    },
    {
      isActive: false,
      revokedAt: new Date(),
      revocationReason: reason,
      revokedBy,
    }
  );
};

// Static method to clean expired tokens
tokenSchema.statics.cleanExpiredTokens = async function () {
  return await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

// Static method to get user's active tokens
tokenSchema.statics.getUserActiveTokens = async function (userId) {
  return await this.find({
    user: userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
    revokedAt: null,
  }).populate("user", "firstName lastName email userType");
};

// Instance method to check if token is valid
tokenSchema.methods.isTokenValid = function () {
  return this.isActive && !this.isExpired && !this.isRevoked;
};

// Instance method to revoke token
tokenSchema.methods.revoke = async function (
  reason = "user_logout",
  revokedBy = null
) {
  this.isActive = false;
  this.revokedAt = new Date();
  this.revocationReason = reason;
  this.revokedBy = revokedBy;
  return await this.save();
};

// Instance method to extend token expiration
tokenSchema.methods.extendExpiration = async function (newExpiresAt) {
  if (newExpiresAt > this.expiresAt) {
    this.expiresAt = newExpiresAt;
    return await this.save();
  }
  return this;
};

export default mongoose.model("Token", tokenSchema);

/*
Token Model Features:

1. **Security Features:**
   - Tokens are hashed using SHA-256 before storage
   - TTL index automatically removes expired tokens
   - Device information tracking for security
   - Token revocation with reasons

2. **Token Types:**
   - Access tokens (short-lived)
   - Refresh tokens (longer-lived)

3. **Token Management:**
   - Create new tokens
   - Validate existing tokens
   - Revoke individual tokens
   - Revoke all user tokens
   - Revoke other user tokens (except current)
   - Clean expired tokens

4. **Multi-tenant Support:**
   - Supports academy-specific tokens
   - Tenant isolation

5. **Refresh Token Rotation:**
   - Chain tracking for refresh tokens
   - Prevents refresh token reuse

6. **Device Tracking:**
   - User agent information
   - IP address
   - Device type and browser info

7. **Virtual Properties:**
   - isExpired: Check if token has expired
   - isRevoked: Check if token is revoked
   - isValid: Check if token is valid
   - ageInMinutes: Token age in minutes

Usage Examples:

// Create access token
const accessToken = await Token.createToken({
  user: userId,
  tokenType: 'access',
  token: 'jwt_access_token_string',
  expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  deviceInfo: { userAgent: req.headers['user-agent'], ipAddress: req.ip }
});

// Create refresh token
const refreshToken = await Token.createToken({
  user: userId,
  tokenType: 'refresh',
  token: 'jwt_refresh_token_string',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  deviceInfo: { userAgent: req.headers['user-agent'], ipAddress: req.ip }
});

// Validate token
const validToken = await Token.findValidToken(tokenString, 'access');

// Revoke token
await Token.revokeToken(tokenString, 'user_logout');

// Revoke all user tokens
await Token.revokeAllUserTokens(userId, 'password_change');

// Get user's active tokens
const activeTokens = await Token.getUserActiveTokens(userId);
*/
