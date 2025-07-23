import mongoose from "mongoose";
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // الطالب الذي دفع
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true }, // المعلم المستفيد
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true },

    type: {
        type: String,
        required: true,
        enum: ["package_purchase", "group_course_payment", "payout", "refund"]
    },
    
    amount: { type: Number, required: true }, 
    platformFee: { type: Number, default: 0 }, // عمولة المنصة
    netAmount: { type: Number, required: true }, 

    paymentGateway: { type: String, default: "Paymob" },
    gatewayTransactionId: { type: String, unique: true, required: true },
    status: { type: String, enum: ["pending", "completed", "failed"], required: true },

}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

export default Transaction;