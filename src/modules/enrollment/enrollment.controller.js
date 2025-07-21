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

// GET /api/v1/enrollments/invitations - List all pending invitations for the logged-in student
export const getPendingInvitations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find the student profile for the logged-in user
  const student = await Student.findOne({ userId }).select("_id");
  if (!student) return notFound(res, "Student profile not found");

  // Query for pending_action enrollments
  const filter = { student: student._id, status: "pending_action" };

  const enrollments = await Enrollment.find(filter)
    .populate({
      path: "halaka",
      select: "title schedule teacher",
      populate: {
        path: "teacher",
        select: "userId",
        populate: {
          path: "userId",
          select: "firstName lastName profilePicture",
        },
      },
    })
    .sort({ createdAt: -1 });

  // Format response
  const data = enrollments.map((enrollment) => {
    const halaka = enrollment.halaka;
    const teacher = halaka && halaka.teacher && halaka.teacher.userId;
    return {
      _id: enrollment._id,
      status: enrollment.status,
      snapshot: enrollment.snapshot,
      halakaDetails: halaka
        ? {
            _id: halaka._id,
            title: halaka.title,
            schedule: halaka.schedule,
          }
        : null,
      teacherDetails: teacher
        ? {
            name: `${teacher.firstName} ${teacher.lastName}`,
            avatar: teacher.profilePicture,
          }
        : null,
    };
  });

  return success(
    res,
    { data, total: enrollments.length },
    "تم استرجاع الدعوات المعلقة بنجاح."
  );
});

// GET /api/v1/enrollments/invitations/:id - Get single invitation details for the authenticated student
export const getInvitationDetails = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const enrollmentId = req.params.id;

  // Find the student profile for the logged-in user
  const student = await Student.findOne({ userId }).select("_id");
  if (!student) return notFound(res, "Student profile not found");

  // Find the enrollment and populate halaka and teacher details
  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    student: student._id,
  }).populate({
    path: "halaka",
    select: "title description schedule teacher",
    populate: {
      path: "teacher",
      select: "userId bio",
      populate: {
        path: "userId",
        select: "firstName lastName profilePicture",
      },
    },
  });

  if (!enrollment) return notFound(res, "Invitation not found");

  const halaka = enrollment.halaka;
  const teacher = halaka && halaka.teacher && halaka.teacher.userId;
  const teacherBio = halaka && halaka.teacher && halaka.teacher.bio;

  return res.status(200).json({
    success: true,
    data: {
      _id: enrollment._id,
      status: enrollment.status,
      snapshot: enrollment.snapshot,
      halakaDetails: halaka
        ? {
            _id: halaka._id,
            title: halaka.title,
            description: halaka.description,
            schedule: halaka.schedule,
          }
        : null,
      teacherDetails: teacher
        ? {
            name: `${teacher.firstName} ${teacher.lastName}`,
            avatar: teacher.profilePicture,
            bio: teacherBio,
          }
        : null,
    },
  });
});

// PATCH /api/v1/enrollments/invitations/:id - Accept or reject a specific invitation (re-add for single invitation)
export const actOnInvitation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const enrollmentId = req.params.id;
  const { action } = req.body;


  // Find the student profile for the logged-in user
  const student = await Student.findOne({ userId }).select("_id");
  if (!student) return notFound(res, "Student profile not found");

  // Find the enrollment
  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    student: student._id,
    status: "pending_action",
  }).populate({
    path: "halaka",
    select: "teacher",
    populate: {
      path: "teacher",
      select: "userId",
      populate: { path: "userId", select: "firstName lastName profilePicture" },
    },
  });

  if (!enrollment)
    return notFound(res, "Invitation not found or already actioned");

  if (action === "accept") {
    enrollment.status = "pending_payment";
    await enrollment.save();
    return res.status(200).json({
      success: true,
      message: "Invitation accepted. Please proceed to payment.",
      data: { _id: enrollment._id, status: enrollment.status },
    });
  } else if (action === "reject") {
    enrollment.status = "cancelled_by_student";
    await enrollment.save();
    // Notify the teacher (optional but recommended)
    try {
      const teacherUser =
        enrollment.halaka &&
        enrollment.halaka.teacher &&
        enrollment.halaka.teacher.userId;
      if (teacherUser && teacherUser._id) {
        const { sendNotification } = await import(
          "../../services/notification.service.js"
        );
        await sendNotification({
          recipient: teacherUser._id,
          type: "halaka_invitation_rejected",
          message: `تم رفض دعوة الحلقة من قبل الطالب.`,
          link: `/halakat/${enrollment.halaka._id}`,
        });
      }
    } catch (notifyErr) {
      console.error(
        "Failed to send rejection notification to teacher:",
        notifyErr
      );
    }
    return res.status(200).json({
      success: true,
      message: "Invitation has been successfully rejected.",
    });
  }
});
