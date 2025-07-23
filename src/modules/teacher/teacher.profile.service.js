import Teacher from '../../../DB/models/teacher.js';
import User from '../../../DB/models/user.js';
import Document from '../../../DB/models/document.js';
import { _uploadFileToCloud } from '../../utils/cloud.js';
import ApiError from '../../utils/apiError.js';

export async function getProfile(teacherId) {
  return Teacher.findById(teacherId).populate('profile').populate('documents');
}

export async function updateProfile(teacherId, data) {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) throw new ApiError('Teacher not found', 404);
  Object.assign(teacher, data);
  await teacher.save();
  return teacher;
}

export async function uploadDocument(teacherId, fileBuffer, docType) {
  const uploadResult = await _uploadFileToCloud(fileBuffer, teacherId, 'teacher', 'documents');
  return Document.create({
    ownerType: 'teacher',
    ownerId: teacherId,
    docType,
    fileUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    status: 'pending',
  });
}

export async function listDocuments(teacherId) {
  return Document.find({ ownerType: 'teacher', ownerId: teacherId });
}

export async function deleteDocument(teacherId, documentId) {
  return Document.findOneAndDelete({ _id: documentId, ownerType: 'teacher', ownerId: teacherId });
}
