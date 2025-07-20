import {
  created,
  notFound,
  validationError,
  error,
} from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/apiError.js";
import Enrollment from "../../../DB/models/enrollment.js";
import Halaka from "../../../DB/models/halaka.js";
import Student from "../../../DB/models/student.js";

/**
 * @desc    Enroll a student in a GROUP halaka
 * @route   POST /api/v1/enrollments/group
 */
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
  // Increment currentStudents count in the halaka
  await Halaka.findByIdAndUpdate(halakaId, {
    $inc: { currentStudents: 1 },
    $addToSet: { students: student._id },
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
    amount: halaka.pricePerStudent, // Use the correct field name
    currency: "EGP",
    description: `Enrollment in: ${halaka.title}`,
  };

  return created(
    res,
    paymentDetails,
    "Enrollment initiated. Please proceed to payment."
  );
});
