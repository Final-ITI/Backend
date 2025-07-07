import { success } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/apiError.js";
import APIFeatures from "../../../utils/apiFeatures.js";
import Teacher from "../../../../DB/models/teacher.js";

export const getVerificationRequests = asyncHandler(async (req, res, next) => {
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

  success(res, responseData, "Verification requests fetched successfully.");
});
