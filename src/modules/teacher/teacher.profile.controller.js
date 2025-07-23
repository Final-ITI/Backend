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
    .populate('profile');
  if (!teacher) throw new ApiError('لم يتم العثور على المعلم', 404);

  // Get user profile
  const user = await User.findById(teacher.userId);

  // Get teacher documents
  const documents = await Document.find({ ownerType: 'teacher', ownerId: teacher._id });

  // Prepare response as requested
  const data = {
    _id: teacher._id,
    userId: teacher.userId,
    specialization: teacher.specialization,
    bio: teacher.bio,
    experience: teacher.experience,
    subjects: teacher.subjects,
    highestDegree: teacher.highestDegree,
    documents: documents.map(doc => ({
      _id: doc._id,
      docType: doc.docType,
      fileUrl: doc.fileUrl,
      status: doc.status
    })),
    profile: {
      fullName:user?.fullName,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      phone: user?.phone,
      birthdate: teacher.birthdate,
      address: user?.address
    }
  };
  return success(res, data, "تم جلب الملف الشخصي بنجاح");
});

// PUT /profile - Update teacher personal profile and upload document (single process)

export const updateTeacherProfileAndDocument = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { bio, experience, specialization, address, phone, email, fullName, birthdate, highestDegree, subjects, docType } = req.body;
  const teacher = await Teacher.findOne({ userId });
  if (!teacher) throw new ApiError('لم يتم العثور على المعلم', 404);

  // Update teacher fields
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

  // Handle document upload if file is present
  if (req.file && docType) {
    await Document.create({
      ownerType: 'teacher',
      ownerId: teacher._id,
      docType,
      fileUrl: (await _uploadFileToCloud(req.file.buffer, teacher._id, 'teacher', 'documents')).secure_url,
      publicId: (await _uploadFileToCloud(req.file.buffer, teacher._id, 'teacher', 'documents')).public_id,
      status: 'pending',
    });
  }

  // Get updated documents
  const documents = await Document.find({ ownerType: 'teacher', ownerId: teacher._id });

  // Prepare response as requested
  const data = {
    _id: teacher._id,
    userId: teacher.userId,
    specialization: teacher.specialization,
    bio: teacher.bio,
    experience: teacher.experience,
    subjects: teacher.subjects,
    highestDegree: teacher.highestDegree,
    documents: documents.map(doc => ({
      _id: doc._id,
      docType: doc.docType,
      fileUrl: doc.fileUrl,
      status: doc.status
    })),
    profile: {
      fullName:user?.fullName,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      phone: user?.phone,
      birthdate: teacher.birthdate,
      address: user?.address
    }
  };

  return success(res, data, "تم تحديث الملف الشخصي بنجاح");
});

// List teacher documents
export const listTeacherDocuments = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError('لم يتم العثور على المعلم', 404);

  const documents = await Document.find({ ownerType: 'teacher', ownerId: teacher._id });
  return success(res, documents, 'تم جلب الوثائق بنجاح');
});

// Delete teacher document
export const deleteTeacherDocument = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new ApiError('لم يتم العثور على المعلم', 404);

  const { id } = req.params;
  const document = await Document.findOneAndDelete({ _id: id, ownerType: 'teacher', ownerId: teacher._id });
  if (!document) throw new ApiError('لم يتم العثور على الوثيقة', 404);
  return success(res, document, 'تم حذف الوثيقة بنجاح');
});
