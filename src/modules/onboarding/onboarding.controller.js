
import * as TeacherService from "./onboarding.service.js";
import ApiError, { asyncHandler } from "../../utils/apiError.js";
import { created, success } from "../../utils/apiResponse.js";

export const profile = asyncHandler(async (req, res) => {
  // Use the service to update the teacher profile
  const responseTeacher = await TeacherService.updateTeacherProfile(
    req.user._id,
    req.body
  );
  created(res, responseTeacher, "Profile updated successfully.");
});

export const uploadMyDocument = asyncHandler(async (req, res, next) => {
  // 1. Validate request input
  if (!req.file) throw new ApiError("No file was uploaded.", 400);

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
    "Document uploaded successfully. Analysis is in progress."
  );
});

export const deleteMyDocument = asyncHandler(async (req, res) => {
  // Call the service
  await TeacherService.deleteVerificationDocument(
    req.teacher._id,
    req.params.docId
  );

  // Respond
  success(res, null, "Document deleted successfully.");
});
