import { paginated } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/apiError.js";
import { getFreelanceTeachersService } from "./teacher.service.js";

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
