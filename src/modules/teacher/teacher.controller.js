import { paginated } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/apiError.js";
import { getFreelanceTeachersService } from "./teacher.service.js";
import { getTeacherDetailsService } from "./teacher.service.js";
import { success } from "../../utils/apiResponse.js";
import ApiError from "../../utils/apiError.js";

/**
 * Fetch a paginated, filtered list of verified freelance teachers.
 */
export const getFreelanceTeachers = asyncHandler(async (req, res) => {
  const {
    q: name,
    specialization,
    rating,
    minPrice,
    maxPrice,
    gender,
    country,
    halqaType,
    page = 1,
    limit = 10,
  } = req.query;

  const { responseData, paginationInfo } = await getFreelanceTeachersService({
    name,
    specialization,
    rating,
    minPrice,
    maxPrice,
    gender,
    country,
    halqaType,
    page: Number(page),
    limit: Number(limit),
  });

  return paginated(res, responseData, paginationInfo);
});

/**
 * Get details of a specific teacher by ID.
 */
export const getTeacherDetails = asyncHandler(async (req, res) => {
  const teacherId = req.params.id;
  const teacherDetails = await getTeacherDetailsService(teacherId);
  if (!teacherDetails) {
    throw new ApiError("لم يتم العثور على المعلم", 404);
  }
  return success(res, teacherDetails, "تم جلب تفاصيل المعلم بنجاح");
});
