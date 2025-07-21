// Create a new file: models/teacherWallet.js
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const teacherWalletSchema = new Schema({
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, unique: true },
    balance: { type: Number, required: true, default: 0 }, // الرصيد القابل للسحب
    pendingBalance: { type: Number, required: true, default: 0 }, // رصيد معلق (اختياري، يمكن استخدامه مستقبلاً)
    currency: { type: String, default: "EGP" },
}, { timestamps: true });

export default mongoose.model("TeacherWallet", teacherWalletSchema);