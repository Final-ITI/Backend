import TeacherWallet from "../../../DB/models/teacherWallet.js";
import PayoutRequest from "../../../DB/models/payoutRequest.js";
import Teacher from "../../../DB/models/teacher.js";
import {
  success,
  created,
  error,
  notFound,
  validationError,
} from "../../utils/apiResponse.js";
import ApiFeatures from "../../utils/apiFeatures.js";
import ApiError, { asyncHandler } from "../../utils/apiError.js";
import mongoose from "mongoose";

/**
 * @desc    Get the current teacher's wallet balance
 */
export const getMyBalance = asyncHandler(async (req, res) => {
  // Your existing code is great. A small improvement is to find the teacher profile once.
  const teacherProfile = await Teacher.findOne({
    userId: req.user._id,
  }).populate("userId", "firstName lastName profilePicture");
  if (!teacherProfile) return notFound(res, "الملف الشخصي للمعلم غير موجود");

  // findOneAndUpdate with upsert is a clean way to get or create a wallet
  const wallet = await TeacherWallet.findOneAndUpdate(
    { teacher: teacherProfile._id },
    { $setOnInsert: { teacher: teacherProfile._id } }, // Only set on creation
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return success(
    res,
    {
      wallet,
      user: {
        firstName: teacherProfile.userId.firstName,
        lastName: teacherProfile.userId.lastName,
        profilePicture: teacherProfile.userId.profilePicture,
      },
    },
    "تم جلب رصيد المحفظة بنجاح"
  );
});

/**
 * @desc    Create a new payout request
 */
export const createPayoutRequest = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) return notFound(res, "الملف الشخصي للمعلم غير موجود");

  // --- Validations ---
  if (!teacher.bankingInfo || !teacher.bankingInfo.accountNumber) {
    return error(
      res,
      "من فضلك أضف معلومات البنك الخاصة بك في إعدادات الملف الشخصي قبل طلب السحب.",
      400
    );
  }
  const wallet = await TeacherWallet.findOne({ teacher: teacher._id });
  const MIN_PAYOUT_AMOUNT = 200;
  if (amount < MIN_PAYOUT_AMOUNT) {
    return error(
      res,
      `الحد الأدنى لمبلغ السحب هو ${MIN_PAYOUT_AMOUNT} جنيه مصري.`,
      400
    );
  }
  if (!wallet || wallet.balance < amount) {
    return error(res, "رصيد غير كاف متاح.", 400);
  }
  const existingPendingRequest = await PayoutRequest.findOne({
    teacher: teacher._id,
    status: "pending",
  });
  if (existingPendingRequest) {
    return error(res, "لديك طلب سحب قيد الانتظار بالفعل.", 400);
  }

  // --- Start of Database Transaction ---
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Operation 1: Update the wallet.
    // We move the amount from 'balance' to 'payoutsPending' field.
    const updatedWallet = await TeacherWallet.findOneAndUpdate(
      { teacher: teacher._id, balance: { $gte: amount } }, // Extra check to prevent race conditions
      {
        $inc: {
          balance: -amount, // Deduct from available balance
          payoutsPending: amount, // Add to pending payouts balance
        },
      },
      { session, new: true } // Pass the session here
    );

    if (!updatedWallet) {
      // This error happens if the balance was spent between the initial check and now
      throw new ApiError(
        "Insufficient balance. The transaction was aborted.",
        400
      );
    }

    // Operation 2: Create the payout request record
    const payoutRequest = new PayoutRequest({
      teacher: teacher._id,
      amount,
      status: "pending",
      bankingInfo: {
        bankName: teacher.bankingInfo.bankName,
        accountHolderName: teacher.bankingInfo.accountHolderName,
        accountNumber: teacher.bankingInfo.accountNumber,
        iban: teacher.bankingInfo.iban,
        swiftCode: teacher.bankingInfo.swiftCode,
      },
    });
    await payoutRequest.save({ session }); // Pass the session here

    // If both operations succeed, commit the transaction
    await session.commitTransaction();

    return created(res, payoutRequest, "تم تقديم طلب السحب بنجاح.");
  } catch (err) {
    // If any operation fails, abort the transaction to roll back all changes
    await session.abortTransaction();
    console.error("Payout Request Transaction Error:", err);
    return error(res, err.message || "فشل في إنشاء طلب السحب.", 500);
  } finally {
    // Always end the session
    session.endSession();
  }
});

/**
 * @desc    Get payout requests history
 */
export const getPayoutRequests = asyncHandler(async (req, res) => {
  // Get teacher profile from the user
  const teacher = await Teacher.findOne({ userId: req.user._id });

  if (!teacher) {
    return error(res, "Teacher profile not found", 404);
  }

  const teacherId = teacher._id;
  const { page = 1, limit = 10, status } = req.query;

  // Build query
  const query = { teacher: teacherId };
  if (status) {
    query.status = status;
  }

  // Create API features for pagination
  const apiFeatures = new ApiFeatures(
    PayoutRequest.find(query)
      .populate("teacher", "userId")
      .populate("processedBy", "fullName email")
      .select("-__v")
      .sort({ createdAt: -1 }),
    req.query
  )
    .paginate()
    .filter();

  const payoutRequests = await apiFeatures.query;
  const totalCount = await PayoutRequest.countDocuments(query);

  const paginationInfo = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalCount / parseInt(limit)),
    totalItems: totalCount,
    itemsPerPage: parseInt(limit),
  };

  return success(
    res,
    {
      payoutRequests,
      pagination: paginationInfo,
    },
    "تم جلب طلبات السحب بنجاح"
  );
});

// --- NEW FUNCTIONS FOR BANKING INFO ---

/**
 * @desc    Get the current teacher's saved banking information
 */
export const getMyBankingInfo = asyncHandler(async (req, res) => {
  const teacherProfile = await Teacher.findOne({ userId: req.user._id }).select(
    "bankingInfo"
  );
  if (!teacherProfile) return error(res, "الملف الشخصي للمعلم غير موجود", 404);

  const bankingInfo = teacherProfile.bankingInfo || {};

  // Check if essential banking info is missing
  const hasBankingInfo =
    bankingInfo.bankName &&
    bankingInfo.accountHolderName &&
    bankingInfo.accountNumber;

  if (!hasBankingInfo) {
    return success(
      res,
      bankingInfo,
      "لم يتم إضافة معلومات البنك بعد. يرجى إضافة اسم البنك واسم صاحب الحساب ورقم الحساب."
    );
  }

  return success(res, bankingInfo, "تم جلب معلومات البنك بنجاح.");
});
/**
 * @desc    Update the teacher's banking information
 */
export const updateMyBankingInfo = asyncHandler(async (req, res) => {
  const { bankName, accountHolderName, accountNumber, iban, swiftCode } =
    req.body;

  // Basic validation
  if (!bankName || !accountHolderName || !accountNumber) {
    return error(
      res,
      "Bank name, account holder name, and account number are required.",
      400
    );
  }

  const teacherProfile = await Teacher.findOne({ userId: req.user._id });
  if (!teacherProfile) return error(res, "Teacher profile not found.", 404);

  teacherProfile.bankingInfo = {
    bankName,
    accountHolderName,
    accountNumber,
    iban,
    swiftCode,
    isVerified: false, // Set to false, requires admin verification
  };

  await teacherProfile.save();

  return success(
    res,
    teacherProfile.bankingInfo,
    "Banking information updated successfully."
  );
});
