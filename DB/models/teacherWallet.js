// Create a new file: models/teacherWallet.js
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const teacherWalletSchema = new Schema(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      unique: true,
    },
    balance: { type: Number, required: true, default: 0 }, // Available balance can withdraw
    pendingBalance: { type: Number, required: true, default: 0 }, // pay from halakat
    payoutsPending: { type: Number, required: true, default: 0, min: [0, 'السحب قيد الانتظار لا يمكن أن يكون سالبًا'] }, // pay that request for teacher and waiting for admin approval
    currency: { type: String, default: "EGP" },
  },
  { timestamps: true }
);

// INDEX
teacherWalletSchema.index({ teacher: 1 });
teacherWalletSchema.index({ balance: 1 });
teacherWalletSchema.index({ payoutsPending: 1 });

const TeacherWallet =
  mongoose.models.TeacherWallet ||
  mongoose.model("TeacherWallet", teacherWalletSchema);
export default TeacherWallet;
