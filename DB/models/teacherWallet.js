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
    payoutsPending: { type: Number, required: true, default: 0 }, // pay that request for teacher and waiting for admin approval
    currency: { type: String, default: "EGP" },
  },
  { timestamps: true }
);

const TeacherWallet =
  mongoose.models.TeacherWallet ||
  mongoose.model("TeacherWallet", teacherWalletSchema);
export default TeacherWallet;
