
import * as TeacherService from "./onboarding.service.js";
import ApiError, { asyncHandler } from "../../utils/apiError.js";
import { created, success } from "../../utils/apiResponse.js";

export const profile = asyncHandler(async (req, res) => {
  // Use the service to update the teacher profile
  const responseTeacher = await TeacherService.updateTeacherProfile(
    req.user._id,
    req.body
  );
  created(res, responseTeacher, "تم تحديث الملف الشخصي بنجاح.");
});

export const uploadMyDocument = asyncHandler(async (req, res, next) => {
  // 1. Validate request input
  if (!req.file) throw new ApiError("لم يتم تحميل أي ملف.", 400);

  // 2. Call the service to do the heavy lifting
  const newDocument = await TeacherService.uploadVerificationDocument(
    req.user._id,
    req.body.docType,
    req.file.buffer
  );

  // 3. Respond to the client
  success(
    res,
    newDocument,
    "تم تحميل المستند بنجاح. التحليل قيد التقدم."
  );
});

export const deleteMyDocument = asyncHandler(async (req, res) => {
  // Call the service
  await TeacherService.deleteVerificationDocument(
    req.teacher._id,
    req.params.docId
  );

  // Respond
  success(res, null, "تم حذف المستند بنجاح.");
});

export const submitForReview = asyncHandler(async (req, res) => {
  // Call the service to validate and submit for review
  const result = await TeacherService.submitForReview(req.user._id);

  success(res, result, "تم إرسال طلب التحقق بنجاح. سيتم مراجعته قريباً.");
});

export const getMyVerificationStatus = asyncHandler(async (req, res) => {
  // Get the teacher's verification status and requirements
  const status = await TeacherService.getVerificationStatus(req.user._id);

  success(res, status, "تم جلب حالة التحقق بنجاح.");
});
