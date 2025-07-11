import Document from "../../../DB/models/document.js";
import Teacher from "../../../DB/models/teacher.js";
import { processIdCardSide } from "../../services/gemini.service.js";
import ApiError from "../../utils/apiError.js";
import { _uploadFileToCloud, cloudinary } from "../../utils/cloud.js";

const SYSTEM_REVIEWER_ID = "000000000000000000000000";

/**
 * Uploads a verification document for a teacher, creates a record,
 * and initiates AI processing in the background.
 * @param {string} userId - The ID of the user performing the upload.
 * @param {string} docType - The type of the document.
 * @param {Buffer} fileBuffer - The file buffer from the request.
 * @returns {Promise<Document>} The newly created document record.
 */
export const uploadVerificationDocument = async (
  userId,
  docType,
  fileBuffer
) => {
  // 1. Validate teacher exists
  const teacher = await Teacher.findOne({ userId });
  if (!teacher) {
    throw new ApiError("Teacher profile not found for this user.", 404);
  }
  // 2. Upload file to cloud
  const uploadResult = await _uploadFileToCloud(
    fileBuffer,
    teacher._id,
    "teacher",
    "verification_documents"
  );

  // 3. Create document record in DB
  const newDocument = await Document.create({
    ownerType: "teacher",
    ownerId: teacher._id,
    docType: docType,
    fileUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    fileHash: uploadResult.etag,
  });

  // 4. Start AI processing in the background (don't wait for it)
  _processDocumentWithAI(
    newDocument,
    fileBuffer,
    docType,
    teacher,
    SYSTEM_REVIEWER_ID
  );

  return newDocument;
};

/**
 * Deletes a teacher's document from cloud and database.
 * @param {string} teacherId - The ID of the teacher owning the document.
 * @param {string} docId - The ID of the document to delete.
 */
export const deleteVerificationDocument = async (teacherId, docId) => {
  const document = await Document.findById(docId);
  if (!document) {
    throw new ApiError("Document not found.", 404);
  }
  if (document.ownerId.toString() !== teacherId.toString()) {
    throw new ApiError(
      "You do not have permission to delete this document.",
      403
    );
  }
  await cloudinary.uploader.destroy(document.publicId);
  await document.deleteOne();
};

/**
 * Updates a teacher's profile information.
 * @param {string} userId - The user ID of the teacher.
 * @param {object} profileData - The profile fields to update.
 * @returns {Promise<object>} The updated teacher profile (with sensitive fields removed).
 */
export const updateTeacherProfile = async (userId, profileData) => {
  const { specialization, bio, skills, experience, sessionPrice, id_number } =
    profileData;
  // 1. Find the teacher profile by userId
  const teacher = await Teacher.findOne({ userId });
  if (!teacher)
    throw new ApiError("Teacher profile not found for this user.", 404);

  // 2. Update the teacher profile with new data
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

  // 3. check if id number is male or female
  const real_gender =
    id_number && id_number[12]
      ? parseInt(id_number[12]) % 2 === 1
        ? "male"
        : "female"
      : null;
  teacher.real_gender = real_gender;

  // 4. Save the updated teacher profile
  const updatedTeacher = await teacher.save();

  // 5. Remove sensitive fields from response
  const { bankingInfo, performance, halakat, ...responseTeacher } =
    updatedTeacher.toObject();
  return responseTeacher;
};

// ===================== PRIVATE HELPERS FOR THIS SERVICE =====================
/**
 * Processes the document with AI and updates the document accordingly.
 * Handles auto-rejection for expired or mismatched national ID.
 */
async function _processDocumentWithAI(
  document,
  fileBuffer,
  docType,
  teacher,
  systemReviewerId
) {
  try {
    if (!["national_id_front", "national_id_back"].includes(docType)) return;

    const side = docType === "national_id_front" ? "front" : "back";
    const aiResult = await processIdCardSide(fileBuffer, side);
    console.log(`AI Result for [${side}]:`, aiResult);
    if (!aiResult) return;

    const aiUpdates = _buildAiUpdates(aiResult);

    // 1. Reject if expired
    if (_shouldRejectForExpiry(aiResult)) {
      await _rejectDocument(
        document,
        aiUpdates,
        "National ID is expired.",
        systemReviewerId
      );
      return;
    }

    // 2. Reject if nationalId mismatch
    if (_shouldRejectForIdMismatch(aiResult, teacher)) {
      await _rejectDocument(
        document,
        aiUpdates,
        "National ID does not match profile.",
        systemReviewerId
      );
      return;
    }

    // 3. Otherwise, just update AI fields
    if (Object.keys(aiUpdates).length > 0) {
      await Document.updateOne({ _id: document._id }, { $set: aiUpdates });
      console.log(`AI data updated for document ${document._id}`);
    }
  } catch (error) {
    // Log the error but don't crash the server.
    console.error(
      `BACKGROUND AI ERROR for teacher ${teacher._id}:`,
      error.message
    );
  }
}

/**
 * Builds the AI updates object from the AI result.
 */
function _buildAiUpdates(aiResult) {
  const aiUpdates = {};
  if (aiResult.nationalId) aiUpdates["ai.id_number"] = aiResult.nationalId;
  if (aiResult.fullName) aiUpdates["ai.fullName"] = aiResult.fullName;
  if (aiResult.address) aiUpdates["ai.address"] = aiResult.address;
  if (aiResult.gender) aiUpdates["ai.gender"] = aiResult.gender;
  if (aiResult.expiryDate) {
    aiUpdates["ai.expiryDate"] = aiResult.expiryDate;
    const expiryDate = new Date(aiResult.expiryDate);
    const currentDate = new Date();
    aiUpdates["ai.isExpired"] = expiryDate < currentDate;
  }
  return aiUpdates;
}

/**
 * Returns true if the document should be rejected for expiry.
 */
function _shouldRejectForExpiry(aiResult) {
  if (!aiResult.expiryDate) return false;
  const expiryDate = new Date(aiResult.expiryDate);
  const currentDate = new Date();
  return expiryDate < currentDate;
}

/**
 * Returns true if the document should be rejected for national ID mismatch.
 */
function _shouldRejectForIdMismatch(aiResult, teacher) {
  return (
    aiResult.nationalId &&
    typeof aiResult.nationalId === "string" &&
    aiResult.nationalId.length === 14 &&
    aiResult.nationalId !== teacher.id_number
  );
}

/**
 * Helper to reject a document with a given reason and reviewer.
 */
async function _rejectDocument(document, aiUpdates, reason, reviewerId) {
  await Document.updateOne(
    { _id: document._id },
    {
      $set: {
        ...aiUpdates,
        status: "rejected",
        rejectionReason: reason,
        reviewDate: new Date(),
        reviewer: reviewerId,
      },
    }
  );
  console.log(`Document ${document._id} auto-rejected: ${reason}`);
}
