import Teacher from '../../../DB/models/teacher.js';
import User from '../../../DB/models/user.js';
import Document from '../../../DB/models/document.js';
import { asyncHandler } from '../../utils/apiError.js';
import { success, error, notFound } from '../../utils/apiResponse.js';
import { _uploadFileToCloud } from '../../utils/cloud.js';
import ApiError from '../../utils/apiError.js';

// GET /profile - Get teacher personal profile



export const getTeacherProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const teacher = await Teacher.findOne({ userId })
    .populate('profile')
    .populate('documents');
  if (!teacher) throw new ApiError('لم يتم العثور على المعلم', 404);

  // Prepare only the requested fields
  const user = teacher.profile || {};
  const data = {
    email: user.email,
    phone: user.phone,
    birthdate: teacher.birthdate,
    address: user.address,
    experience: teacher.experience,
    highestDegree: teacher.highestDegree,
    specialization: teacher.specialization,
    subjects: teacher.subjects, // assuming you have a 'subjects' field
    bio: teacher.bio,
    // documents: teacher.documents || [],
  };
  return success(res, data, 'تم جلب الملف الشخصي بنجاح');
});

// PUT /profile - Update teacher personal profile

export const updateTeacherProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { bio, experience, specialization, address, phone, email, fullName, birthdate, highestDegree, subjects } = req.body;
  const teacher = await Teacher.findOne({ userId });
  if (!teacher) throw new ApiError('لم يتم العثور على المعلم', 404);

  if (bio) teacher.bio = bio;
  if (experience) teacher.experience = experience;
  if (specialization) teacher.specialization = specialization;
  if (birthdate) teacher.birthdate = birthdate;
  if (highestDegree) teacher.highestDegree = highestDegree;
  if (subjects) teacher.subjects = subjects;
  await teacher.save();

  // Update user info
  const user = await User.findById(teacher.userId);
  if (user) {
    if (address) user.address = address;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    if (fullName) {
      const [firstName, ...lastName] = fullName.split(' ');
      user.firstName = firstName;
      user.lastName = lastName.join(' ');
    }
    await user.save();
  }

  // Prepare only the requested fields for response
  const responseData = {
    email: user?.email,
    phone: user?.phone,
    birthdate: teacher.birthdate,
    address: user?.address,
    experience: teacher.experience,
    highestDegree: teacher.highestDegree,
    specialization: teacher.specialization,
    subjects: teacher.subjects,
    bio: teacher.bio,
    // documents: await Document.find({ ownerType: 'teacher', ownerId: teacher._id })
  };

  return success(res, responseData, 'تم تحديث الملف الشخصي بنجاح');
});

// POST /profile/documents - Upload teacher document

export const uploadTeacherDocument = asyncHandler(async (req, res) => {
  // Always get the teacher by userId for consistency
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError('لم يتم العثور على المعلم', 404);

  if (!req.file) throw new ApiError('لم يتم رفع أي ملف', 400);
  const { docType } = req.body;
  if (!docType) throw new ApiError('نوع الوثيقة مطلوب', 400);

  // Upload to cloud
  const uploadResult = await _uploadFileToCloud(req.file.buffer, teacher._id, 'teacher', 'documents');

  // Save document
  const document = await Document.create({
    ownerType: 'teacher',
    ownerId: teacher._id,
    docType,
    fileUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    status: 'pending',
  });

  return success(res, document, 'تم رفع الوثيقة بنجاح');
});

// GET /profile/documents - List teacher documents

export const listTeacherDocuments = asyncHandler(async (req, res) => {
  // Find the teacher by userId
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError('لم يتم العثور على المعلم', 404);

  // Use teacher._id for ownerId
  const documents = await Document.find({ ownerType: 'teacher', ownerId: teacher._id });
  return success(res, documents, 'تم جلب الوثائق بنجاح');
});

// DELETE /profile/documents/:id - Delete teacher document

export const deleteTeacherDocument = asyncHandler(async (req, res) => {
  // Always get the teacher by userId for consistency
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError('لم يتم العثور على المعلم', 404);

  const { id } = req.params;
  // Use teacher._id for ownerId to match how documents are created and listed
  const document = await Document.findOneAndDelete({ _id: id, ownerType: 'teacher', ownerId: teacher._id });
  if (!document) throw new ApiError('لم يتم العثور على الوثيقة', 404);
  return success(res, document, 'تم حذف الوثيقة بنجاح');
});
