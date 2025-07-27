import Document from "../../../DB/models/document.js";
import Teacher from "../../../DB/models/teacher.js";
import { processIdCardSide } from "../../services/gemini.service.js";
import ApiError from "../../utils/apiError.js";
import { _uploadFileToCloud, cloudinary } from "../../utils/cloud.js";

const SYSTEM_REVIEWER_ID = "000000000000000000000000";

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
  const teacher = await getTeacher(userId);

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
        throw new ApiError("هذا الرقم التعريفي مستخدم من قبل معلم آخر.", 400);
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
  const teacher = await getTeacher(userId);
  // 2. Check if a document of the same type already exists
  const existingDocument = await Document.findOne({
    ownerId: teacher._id,
    docType: docType,
  });

  if (existingDocument) {
    throw new ApiError(
      `المستند من نوع ${docType} لقد تم تحميله مسبقاً. يرجى حذفه قبل تحميل مستند جديد.`,
      409
    );
  }

  // 3. Upload file to cloud
  const uploadResult = await _uploadFileToCloud(
    fileBuffer,
    teacher._id,
    "teacher",
    "verification_documents"
  );

  // 4. Create document record in DB
  const newDocument = await Document.create({
    ownerType: "teacher",
    ownerId: teacher._id,
    docType: docType,
    fileUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    fileHash: uploadResult.etag,
  });

  // 5. Start AI processing in the background (don't wait for it)
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
    throw new ApiError("لم يتم العثور على المستند.", 404);
  }
  if (document.ownerId.toString() !== teacherId.toString()) {
    throw new ApiError("ليس لديك إذن لحذف هذا المستند.", 403);
  }
  await cloudinary.uploader.destroy(document.publicId);
  await document.deleteOne();
};

/**
 * Submit teacher profile for verification review
 * @param {string} userId - The user ID of the teacher
 * @returns {Promise<object>} The submission result
 */
export const submitForReview = async (userId) => {
  // 1. Find the teacher profile
  const teacher = await getTeacher(userId);

  // 3. Validate profile completion
  const profileValidation = await validateProfileCompletion(teacher);
  if (!profileValidation.isComplete) {
    throw new ApiError(
      `Profile incomplete: ${profileValidation.missingFields.join(", ")}`,
      400
    );
  }

  // 4. Validate required documents
  const documentValidation = await validateRequiredDocuments(teacher._id);
  if (!documentValidation.isComplete) {
    throw new ApiError(
      `Missing required documents: ${documentValidation.missingDocs.join(
        ", "
      )}`,
      400
    );
  }

  // 5. Update status to pending
  teacher.verificationStatus = "pending";
  teacher.rejectionReason = undefined; // Clear any previous rejection reason
  await teacher.save();

  return {
    teacherId: teacher._id,
    verificationStatus: teacher.verificationStatus,
    submittedAt: new Date(),
    message: "تم تقديم الملف الشخصي للمراجعة بنجاح.",
  };
};

/**
 * Get teacher's verification status and requirements
 * @param {string} userId - The user ID of the teacher
 * @returns {Promise<object>} The verification status and requirements
 */
export const getVerificationStatus = async (userId) => {
  // 1. Find the teacher profile
  const teacher = await Teacher.findOne({ userId });
  if (!teacher) {
    throw new ApiError("لم يتم العثور على ملف المعلم لهذا المستخدم.", 404);
  }

  // 2. Get profile completion status
  const profileValidation = await validateProfileCompletion(teacher);

  // 3. Get document completion status
  const documentValidation = await validateRequiredDocuments(teacher._id);

  // 4. Get uploaded documents
  const documents = await Document.find({
    ownerType: "teacher",
    ownerId: teacher._id,
  }).select("docType status fileUrl createdAt");

  return {
    verificationStatus: teacher.verificationStatus,
    rejectionReason: teacher.rejectionReason,
    profileCompletion: {
      isComplete: profileValidation.isComplete,
      missingFields: profileValidation.missingFields,
      completedFields: profileValidation.completedFields,
    },
    documentCompletion: {
      isComplete: documentValidation.isComplete,
      missingDocs: documentValidation.missingDocs,
      uploadedDocs: documentValidation.uploadedDocs,
    },
    documents: documents,
    canSubmit:
      profileValidation.isComplete &&
      documentValidation.isComplete &&
      (teacher.verificationStatus === "not_submitted" ||
        teacher.verificationStatus === "rejected"),
  };
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
        "رقم الهوية الوطنية منتهي الصلاحية.",
        systemReviewerId
      );
      return;
    }

    // 2. Reject if nationalId mismatch
    if (_shouldRejectForIdMismatch(aiResult, teacher)) {
      await _rejectDocument(
        document,
        aiUpdates,
        "رقم الهوية الوطنية لا يتطابق مع الملف الشخصي.",
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

export const getTeacher = async (userId) => {
  // 1. Find the teacher profile by userId
  const teacher = await Teacher.findOne({ userId });
  if (!teacher) {
    throw new ApiError("لم يتم العثور على ملف المعلم لهذا المستخدم.", 404);
  }
  // 2. Validate current status
  if (
    teacher.verificationStatus !== "not_submitted" &&
    teacher.verificationStatus !== "rejected"
  ) {
    throw new ApiError(
      "يمكن تقديم الملف الشخصي فقط عندما تكون الحالة 'غير مقدمة' أو 'مرفوضة'.",
      400
    );
  }

  return teacher;
};

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

/**
 * Validate if teacher profile is complete
 * @param {Object} teacher - Teacher document
 * @returns {Promise<object>} Validation result
 */
async function validateProfileCompletion(teacher) {
  const requiredFields = [
    "bio",
    "experience",
    "specialization",
    "id_number",
    "sessionPrice",
  ];

  const missingFields = [];
  const completedFields = [];

  for (const field of requiredFields) {
    if (
      !teacher[field] ||
      (Array.isArray(teacher[field]) && teacher[field].length === 0) ||
      (typeof teacher[field] === "string" && teacher[field].trim() === "")
    ) {
      missingFields.push(field);
    } else {
      completedFields.push(field);
    }
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completedFields,
  };
}

/**
 * Validate if required documents are uploaded
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<object>} Validation result
 */
async function validateRequiredDocuments(teacherId) {
  const requiredDocTypes = [
    "national_id_front",
    "national_id_back",
    "certificates",
  ];

  const uploadedDocs = await Document.find({
    ownerType: "teacher",
    ownerId: teacherId,
    docType: { $in: requiredDocTypes },
  }).select("docType status");

  const uploadedDocTypes = uploadedDocs.map((doc) => doc.docType);
  const missingDocs = requiredDocTypes.filter(
    (docType) => !uploadedDocTypes.includes(docType)
  );

  return {
    isComplete: missingDocs.length === 0,
    missingDocs,
    uploadedDocs: uploadedDocs,
  };
}
