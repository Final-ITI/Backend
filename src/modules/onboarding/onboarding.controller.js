import Document from "../../../DB/models/document.js";
import Teacher from "../../../DB/models/teacher.js";
import { processIdCardWithGemini } from "../../services/gemini.service.js";
import ApiError, { asyncHandler } from "../../utils/apiError.js";
import { created, success } from "../../utils/apiResponse.js"; 
import { cloudinary, uploadToCloud } from "../../utils/cloud.js";

export const profile = asyncHandler(async (req, res) => {
  // 1. Data from request body
  const { specialization, bio, skills, experience, sessionPrice, id_number } =
    req.body;
  // 2. Find the teacher profile by userId
  const teacher = await Teacher.findOne({ userId: req.user._id });

  if (!teacher)
    throw new ApiError("Teacher profile not found for this user.", 404);

  // 3. Update the teacher profile with new data
  if (specialization) teacher.specialization = specialization;
  if (bio) teacher.bio = bio;
  if (skills) teacher.skills = skills;
  if (experience) teacher.experience = experience;
  if (sessionPrice) teacher.sessionPrice = sessionPrice;
  if (id_number) teacher.id_number = id_number;

  // 4. check if id number is male or female
  const real_gender =
    id_number && id_number[12]
      ? parseInt(id_number[12]) % 2 === 1
        ? "male"
        : "female"
      : null;
  teacher.real_gender = real_gender;
  // 5. Save the updated teacher profile
  const updatedTeacher = await teacher.save();

  // 5. Return the updated profile
  created(res, updatedTeacher, "Profile updated successfully.");
});

export const uploadMyDocument = asyncHandler(async (req, res, next) => {
  // 1. Validate the request
  if (!req.file) {
    return next(new ApiError("No file was uploaded", 400));
  }
  const { docType } = req.body;
  if (!docType) {
    return next(new ApiError('The "docType" field is required.', 400));
  }

  // 2. Find the teacher profile using the logged-in user's ID
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) {
    return next(new ApiError("Teacher profile not found for this user.", 404));
  }

  // 3. Upload the original file buffer to the cloud
  const uploadResult = await uploadToCloud(req.file.buffer, {
    folder: `motqan/teachers/${teacher._id}/verification_documents`, // Use teacher._id
    resource_type: "auto",
  });

  if (!uploadResult || !uploadResult.secure_url) {
    return next(new ApiError("Failed to upload file to the cloud.", 500));
  }

  // 4. Create a new document record in the database
  const newDocument = await Document.create({
    ownerType: "teacher",
    ownerId: teacher._id, // Use teacher._id
    docType: docType,
    fileUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    fileHash: uploadResult.etag,
  });


  if (docType === 'national_id_front') {
    console.log("Processing National ID front image for teacher:", teacher._id);
    const ocrResult = await processIdCardWithGemini(req.file.buffer); 
    console.log(`AI Result for teacher ${teacher._id}:`, ocrResult);

    if (ocrResult && ocrResult.nationalId) {
        teacher.id_number = ocrResult.nationalId;
        // You can also compare ocrResult.name with the name in the DB
        await teacher.save();
        console.log(`AI Success: Found National ID ${ocrResult.nationalId} for teacher ${teacher._id}`);
    } else {
        console.warn(`AI Warning: Could not find National ID for teacher ${teacher._id}`);
    }
}
// 

  // 5. Send a success response back to the client
  success(res, newDocument, "Document uploaded successfully.");
});

export const deleteMyDocument = asyncHandler(async (req, res) => {
  // 1. Find the document in the database
  const document = await Document.findById(req.params.docId);
  // 2. Check if the document exists
  if (!document) throw new ApiError("Document not found.", 404);

  // 3. Check if belongs to the logged-in user
  if (document.ownerId.toString() !== req.teacher._id.toString())
    throw new ApiError(
      "You do not have permission to delete this document.",
      403
    );

  // 4. Delete the file from Cloudinary using its public_id
  await cloudinary.uploader.destroy(document.publicId);

  // 5. Delete the document record from the database
  await document.deleteOne();

  success(res, null, "Document deleted successfully.");
});
