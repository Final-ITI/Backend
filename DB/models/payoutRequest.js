import mongoose from "mongoose";
const Schema = mongoose.Schema;

const payoutRequestSchema = new Schema(
  {
    /**
     * @desc The teacher who made the request.
     */
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    /**
     * @desc The amount requested for withdrawal.
     */
    amount: {
      type: Number,
      required: true,
      min: 1, // Example: minimum payout amount
    },

    /**
     * @desc The status of the payout request.
     */
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },

    /**
     * @desc Banking info snapshot at the time of request.
     */
    bankingInfo: {
      bankName: String,
      accountHolderName: String,
      accountNumber: String,
      iban: String,
      swiftCode: String,
      // This should be encrypted in production
      isVerified: {
        type: Boolean,
        default: false,
      },
    },

    /**
     * @desc The admin who processed the request (optional).
     */
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Super Admin
    },

    /**
     * @desc Notes from the admin regarding the request (e.g., reason for rejection).
     */
    adminNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// INDEXES
payoutRequestSchema.index({ teacher: 1 });
payoutRequestSchema.index({ status: 1 });
payoutRequestSchema.index({ createdAt: -1 });
payoutRequestSchema.index({ processedBy: 1 });

const PayoutRequest =
  mongoose.models.PayoutRequest ||
  mongoose.model("PayoutRequest", payoutRequestSchema);
export default PayoutRequest;
