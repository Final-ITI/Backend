import {
  created,
  notFound,
  validationError,
  error,
  success,
} from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/apiError.js";
import Enrollment from "../../../DB/models/enrollment.js";
import Halaka from "../../../DB/models/halaka.js";
import Student from "../../../DB/models/student.js";
import { EnrollmentService } from "./enrollment.service.js";

export const enrollInGroupHalaka = asyncHandler(async (req, res, next) => {
  const { id: halakaId } = req.body;
  const userId = req.user._id;

  // 2. Find associated profiles
  const student = await Student.findOne({ userId }).select({ _id: 1 });
  if (!student) return notFound(res, "Student profile not found");

  const halaka = await Halaka.findById(halakaId);
  if (!halaka) return notFound(res, "Halaka not found");

  // 3. Controller-level check: Is this the correct endpoint for this halaka type?
  if (halaka.halqaType !== "halqa") {
    return error(
      res,
      "This enrollment process is for group halaqas only.",
      400
    );
  }

  // 4. Create the enrollment. The pre-save hook will handle all business logic validation.
  const enrollment = await Enrollment.create({
    student: student._id,
    halaka: halakaId,
    status: "pending_payment",
    snapshot: {
      halakaTitle: halaka.title,
      halakaType: halaka.halqaType,
      pricePerSession: halaka.price,
      pricePerStudent: halaka.totalPrice,
    },
  });

  // --- Activate ChatGroup integration ---
  // Add the student's userId to the halaka's chatGroup participants if not already present
  if (halaka.chatGroup) {
    const ChatGroup = (await import("../../../DB/models/chatGroup.js")).default;
    const chatGroup = await ChatGroup.findById(halaka.chatGroup);
    if (chatGroup) {
      // Find the full student doc to get the userId
      const studentDoc = await Student.findById(student._id).populate("userId");
      if (studentDoc && studentDoc.userId) {
        const userObjectId = studentDoc.userId._id;
        if (
          !chatGroup.participants
            .map((id) => id.toString())
            .includes(userObjectId.toString())
        ) {
          chatGroup.participants.push(userObjectId);
          await chatGroup.save();
        }
      }
    }
  }
  // --- END ChatGroup integration ---

  // 5. Prepare response for the frontend to proceed to payment
  const paymentDetails = {
    enrollmentId: enrollment._id,
    amount: halaka.totalPrice,
    currency: enrollment.snapshot.currency,
    description: `Enrollment in: ${halaka.title}`,
  };

  return created(
    res,
    paymentDetails,
    "Enrollment initiated. Please proceed to payment."
  );
});

// --- Controllers ---

// GET /api/v1/enrollments/invitations - List all pending invitations for the logged-in student
export const getPendingInvitations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const student = await Student.findOne({ userId }).select("_id");
  if (!student) return notFound(res, "Student profile not found");

  // Pagination
  const features = new (await import("../../utils/apiFeatures.js")).default(
    Enrollment.find({
      student: student._id,
      status: "pending_action",
    }).populate(EnrollmentService.invitationPopulation),
    req.query
  )
    .sort()
    .paginate();
  const enrollments = await features.query;

  // Total count for pagination
  const total = await Enrollment.countDocuments({
    student: student._id,
    status: "pending_action",
  });

  // Format response
  const data = enrollments.map(EnrollmentService.formatInvitation);

  return success(res, { data, total }, "تم استرجاع الدعوات المعلقة بنجاح.");
});

// GET /api/v1/enrollments/invitations/:id - Get single invitation details for the authenticated student
export const getInvitationDetails = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const enrollmentId = req.params.id;
  const student = await Student.findOne({ userId }).select("_id");
  if (!student) return notFound(res, "Student profile not found");

  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    student: student._id,
  }).populate(EnrollmentService.invitationPopulation);

  if (!enrollment) return notFound(res, "Invitation not found");


  return success(
    res,
    EnrollmentService.formatInvitation(enrollment),
    "تم استرجاع تفاصيل الدعوة بنجاح."
  );
});

// PATCH /api/v1/enrollments/invitations/:id - Accept or reject a specific invitation
export const actOnInvitation = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  const { id: enrollmentId } = req.params;
  const { action } = req.body;

  // Get student profile
  const student = await Student.findOne({ userId }).select("_id");
  if (!student) return notFound(res, "Student profile not found");

  // Get enrollment with populated data
  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    student: student._id,
    status: "pending_action",
  }).populate(EnrollmentService.invitationPopulation);

  if (!enrollment) {
    return notFound(res, "Invitation not found or already actioned");
  }

  // Process the invitation action (accept/reject)
  const actionMap = {
    accept: {
      status: "pending_payment",
      message: "Invitation accepted. Please proceed to payment.",
    },
    reject: {
      status: "cancelled_by_student",
      message: "Invitation rejected successfully.",
    },
  };

  const { status, message } = actionMap[action];
  enrollment.status = status;
  await enrollment.save();

  const result = {
    data: { _id: enrollment._id, status: enrollment.status },
    message,
  };

  // Send notification to teacher (fire and forget)
  EnrollmentService.sendTeacherNotification(enrollment, action).catch((err) =>
    console.error(`Failed to send ${action} notification to teacher:`, err)
  );

  return success(res, result.data, result.message);
});


