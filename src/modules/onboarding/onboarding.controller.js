import Document from "../../../DB/models/document.js";
import Teacher from "../../../DB/models/teacher.js";
import { processIdCardSide } from "../../services/gemini.service.js";
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
  if (id_number) {
    const isIdNumberChanged =
      teacher.id_number !== id_number &&
      teacher.id_number !== teacher.ai?.id_number;

    if (isIdNumberChanged) {
      const existingIdNumber = await Teacher.findOne({ id_number });

      if (existingIdNumber) {
        throw new ApiError(
          "This ID number is already used by another teacher.",
          400
        );
      }
    }

    teacher.id_number = id_number;
  }

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

  // Remove sensitive fields from response
  const { bankingInfo, performance, halakat, ...responseTeacher } =
    updatedTeacher.toObject();

  // 5. Return the updated profile
  created(res, responseTeacher, "Profile updated successfully.");
});

export const uploadMyDocument = asyncHandler(async (req, res, next) => {
  // --- Step 1: Validate Incoming Request ---
  if (!req.file) {
    return next(new ApiError("No file was uploaded.", 400));
  }
  const { docType } = req.body;
  if (!docType) {
    return next(new ApiError('The "docType" field is required.', 400));
  }

  // --- Step 2: Find the Associated Teacher Profile ---
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) {
    return next(new ApiError("Teacher profile not found for this user.", 404));
  }

  // --- Step 3: Upload File to Cloud Storage (e.g., Cloudinary) ---
  const uploadResult = await uploadToCloud(req.file.buffer, {
    folder: `motqan/teachers/${teacher._id}/verification_documents`,
    resource_type: "auto",
  });

  if (!uploadResult || !uploadResult.secure_url) {
    return next(new ApiError("Failed to upload file to the cloud.", 500));
  }

  // --- Step 4: Create Document Record in Database ---
  const newDocument = await Document.create({
    ownerType: "teacher",
    ownerId: teacher._id,
    docType: docType,
    fileUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    fileHash: uploadResult.etag,
  });

  // --- Step 5: Send IMMEDIATE Success Response to User ---
  // The user should not wait for the AI processing.
  success(
    res,
    newDocument,
    "Document uploaded successfully. Analysis is in progress."
  );

  // --- Step 6: Trigger AI Processing in the Background ---
  // We do this AFTER sending the response.
  // We wrap it in a function and call it without 'await'.
  const runAiProcessing = async () => {
    try {
      if (docType === "national_id_front" || docType === "national_id_back") {
        const side = docType === "national_id_front" ? "front" : "back";
        const aiResult = await processIdCardSide(req.file.buffer, side);

        console.log(`AI Result for [${side}]:`, aiResult);

        if (aiResult) {
          // Prepare updates for the document's ai subdocument
          const aiUpdates = {};
          if (aiResult.nationalId)
            aiUpdates["ai.id_number"] = aiResult.nationalId;
          if (aiResult.fullName) aiUpdates["ai.fullName"] = aiResult.fullName;
          if (aiResult.address) aiUpdates["ai.address"] = aiResult.address;
          if (aiResult.gender) aiUpdates["ai.gender"] = aiResult.gender;
          if (aiResult.expiryDate) {
            aiUpdates["ai.expiryDate"] = aiResult.expiryDate;

            // Validate if the ID has expired
            const expiryDate = new Date(aiResult.expiryDate);
            const currentDate = new Date();

            if (expiryDate < currentDate) {
              aiUpdates["ai.isExpired"] = true;
              console.log(
                `National ID expired for teacher ${teacher._id}. Expiry date: ${aiResult.expiryDate}`
              );
            } else {
              aiUpdates["ai.isExpired"] = false;
            }
          }

          // --- NEW LOGIC: Auto-reject if nationalId does not match profile ---
          if (
            aiResult.nationalId &&
            aiResult.nationalId !== teacher.id_number
          ) {
            // Auto-reject the document
            await Document.updateOne(
              { _id: newDocument._id },
              {
                $set: {
                  ...aiUpdates,
                  status: "rejected",
                  rejectionReason: "National ID does not match profile.",
                  reviewDate: new Date(),
                  reviewer: null, // Optionally set to a system user if you have one
                },
              }
            );
            console.log(
              `Document ${newDocument._id} auto-rejected: National ID does not match profile.`
            );
            return; // Stop further processing
          }

          // --- END NEW LOGIC ---

          // Update the document record in one go (if not rejected)
          if (Object.keys(aiUpdates).length > 0) {
            console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%");
            const data = await Document.updateOne(
              { _id: newDocument._id },
              { $set: aiUpdates }
            );
            console.log(
              `AI data updated for document ${newDocument._id}:`,
              data
            );
          }
        }
      }
    } catch (error) {
      // Log the error but don't crash the server.
      // The main request has already succeeded.
      console.error(
        `BACKGROUND AI ERROR for teacher ${teacher._id}:`,
        error.message
      );
    }
  };

  runAiProcessing(); // Run the function without await
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
