import { success } from "../../../utils/apiResponse.js";
import ApiError, { asyncHandler } from "../../../utils/apiError.js";
import APIFeatures from "../../../utils/apiFeatures.js";
import Teacher from "../../../../DB/models/teacher.js";
import Document from "../../../../DB/models/document.js";

export const getVerificationRequests = asyncHandler(async (req, res) => {
  const { q, verificationStatus, page = 1 } = req.query;
  const limit = 10;
  // Build the base query
  let baseQuery = {};

  // Add verification status filter if provided
  if (
    verificationStatus &&
    ["pending", "approved", "rejected"].includes(verificationStatus)
  ) {
    baseQuery.verificationStatus = verificationStatus;
  } else {
    // Default to pending if no status specified
    baseQuery.verificationStatus = "pending";
  }

  // Add search functionality for full name or email
  if (q) {
    baseQuery.$or = [
      // Search in teacher's user profile (firstName + lastName)
      {
        $expr: {
          $regexMatch: {
            input: {
              $concat: [
                { $ifNull: ["$userId.firstName", ""] },
                " ",
                { $ifNull: ["$userId.lastName", ""] },
              ],
            },
            regex: q,
            options: "i",
          },
        },
      },
      // Search in teacher's user email
      {
        "userId.email": {
          $regex: q,
          $options: "i",
        },
      },
    ];
  }

  // Use APIFeatures for pagination and sorting
  const features = new APIFeatures(Teacher.find(baseQuery), req.query)
    .paginate()
    .sort();

  // Build the populated query
  features.query = features.query
    .select("createdAt verificationStatus userId ")
    .populate({
      path: "userId",
      select: "_id firstName lastName email profilePicture userType",
    })
    .populate({
      path: "documents",
      select: "docType fileUrl status",
      match: { ownerType: "teacher" },
    });

  // Execute the query
  const teachers = await features.query;

  // Get total count for current filter
  const total = await Teacher.countDocuments(baseQuery);

  // Calculate pagination info
  const currentPage = parseInt(page);
  const totalPages = Math.ceil(total / parseInt(limit));

  // Get statistics
  const totalPending = await Teacher.countDocuments({
    verificationStatus: "pending",
  });

  // Get this week's statistics (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const approvedThisWeek = await Teacher.countDocuments({
    verificationStatus: "approved",
    updatedAt: { $gte: oneWeekAgo },
  });

  const rejectedThisWeek = await Teacher.countDocuments({
    verificationStatus: "rejected",
    updatedAt: { $gte: oneWeekAgo },
  });

  // Prepare response data
  const responseData = {
    teachers,
    metadata: {
      totalPending,
      approvedThisWeek,
      rejectedThisWeek,
      currentPage,
      totalPages,
      totalTeachers: total,
    },
  };

  success(res, responseData, "تم جلب طلبات التحقق بنجاح.");
});

export const getTeacherVerificationDetails = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  const teacher = await Teacher.findById(teacherId)
    .select(
      "createdAt verificationStatus userId documents skills experience bio specialization id_number sessionPrice currency"
    )
    .populate({
      path: "userId",
      select: "_id firstName lastName email profilePicture userType",
    })
    .populate({
      path: "documents",
      select: "docType fileUrl status createdAt",
      match: { ownerType: "teacher" },
    })
    .lean();

  if (!teacher) throw new ApiError("Teacher not found", 404);
  console.log();

  // Transform the response to match the required structure
  const transformedResponse = {
    _id: teacher._id,
    verificationStatus: teacher.verificationStatus,
    user: {
      name: `${teacher.userId.firstName} ${teacher.userId.lastName}`,
      email: teacher.userId.email,
      avatar: teacher.userId.profilePicture,
    },
    profile: {
      experience: teacher.experience,
      bio: teacher.bio,
      skills: teacher.skills
        ? teacher.skills.split(",").map((skill) => skill.trim())
        : [],
      specialization: teacher.specialization,
      sessionPrice: teacher.sessionPrice,
      currency: teacher.currency,
      idNumber: teacher.id_number,
    },
    documents: teacher.documents.map((doc) => ({
      _id: doc._id,
      docType: doc.docType
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      status: doc.status,
      fileUrl: doc.fileUrl,
      createdAt: doc.createdAt,
      ai: doc.ai,
    })),
  };

  success(res, transformedResponse, "تم جلب تفاصيل التحقق من المعلم بنجاح.");
});

export const reviewDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { action } = req.body;

  if (!["approve", "reject"].includes(action)) {
    throw new ApiError(
      "الإجراء غير صالح، يجب أن يكون 'approve' أو 'reject'",
      400
    );
  }

  const document = await Document.findById(documentId).select(
    "status reviewDate reviewer"
  );
  if (!document) throw new ApiError("Document not found", 404);

  if (document.status !== "pending") {
    throw new ApiError("Document is not pending for approval", 400);
  }

  document.status = action === "approve" ? "approved" : "rejected";
  document.reviewDate = new Date();
  document.reviewer = req.user._id;
  await document.save();

  const message =
    action === "approve"
      ? "تمت الموافقة على المستند بنجاح."
      : "تم رفض المستند بنجاح.";

  success(res, document, message);
});

export const updateTeacherVerificationStatus = asyncHandler(
  async (req, res) => {
    const { teacherId } = req.params;
    const { action } = req.body;

    if (!["approve", "reject"].includes(action)) {
      throw new ApiError(
        "الإجراء غير صالح، يجب أن يكون 'approve' أو 'reject'",
        400
      );
    }

    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) throw new ApiError("Teacher not found", 404);

    if (teacher.verificationStatus !== "pending") {
      throw new ApiError("Teacher verification is not pending", 400);
    }

    // Update all teacher's documents
    const documentStatus = action === "approve" ? "approved" : "rejected";
    await Document.updateMany(
      {
        ownerId: teacherId,
        ownerType: "teacher",
        status: "pending",
      },
      {
        status: documentStatus,
        reviewDate: new Date(),
        reviewer: req.user._id,
      }
    );

    // Update teacher's verification status
    teacher.verificationStatus = action === "approve" ? "approved" : "rejected";
    await teacher.save();

    const message =
      action === "approve"
        ? "تمت الموافقة على جميع مستندات المعلم بنجاح."
        : "تم رفض جميع مستندات المعلم بنجاح.";

    success(
      res,
      { teacherId, verificationStatus: teacher.verificationStatus },
      message
    );
  }
);
