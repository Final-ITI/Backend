import Teacher from "../../../DB/models/teacher.js";
import mongoose from "mongoose";
import Academy from "../../../DB/models/academy.js";


export async function getFreelanceTeachersService({
  name,
  specialization,
  rating,
  minPrice,
  maxPrice,
  gender,
  country,
  halqaType,
  page = 1,
  limit = 10,
}) {
  const skip = (Number(page) - 1) * Number(limit);
  const match = buildTeacherMatch({
    specialization,
    rating,
    minPrice,
    maxPrice,
  });
  const pipeline = buildTeacherPipeline({
    match,
    name,
    gender,
    country,
    halqaType,
    skip,
    limit: Number(limit),
  });
  // Count total matching teachers (for pagination)
  const countPipeline = pipeline.slice(0, -3).concat({ $count: "total" }); // Remove skip, limit, project
  const [countResult] = await Teacher.aggregate(countPipeline);
  const totalItems = countResult ? countResult.total : 0;
  const totalPages = Math.ceil(totalItems / Number(limit));
  // Fetch paginated teachers
  const teachers = await Teacher.aggregate(pipeline);
  // Response
  const responseData = {
    teachers,
    count: totalItems,
    filters: {
      ...(name && { name }),
      ...(specialization && { specialization }),
      ...(rating && { rating }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      ...(gender && { gender }),
      ...(country && { country }),
      ...(halqaType && { halqaType }),
    },
  };
  const paginationInfo = {
    currentPage: Number(page),
    totalPages,
    totalItems,
    itemsPerPage: Number(limit),
    hasNext: Number(page) < totalPages,
    hasPrev: Number(page) > 1,
    count: totalItems,
    filteredCount: totalItems,
  };
  return { responseData, paginationInfo };
}

export async function getTeacherDetailsService(teacherId) {
  const teacher = await Teacher.findById(teacherId)
    .populate('userId', 'firstName lastName email gender country profilePicture') // Populate user details
    .populate('halakat') // Populate halakat if needed
    .populate('academyId'); // Populate academy details if needed

  if (!teacher) {
    return null;
  }

  // Manually populate documents as a separate query
  const documents = await mongoose.model('Document').find({ ownerId: teacher._id, ownerType: 'teacher' });

  // Construct the response object for a student's view
  const teacherDetails = {
    _id: teacher._id,
    firstName: teacher.userId?.firstName,
    lastName: teacher.userId?.lastName,
    email: teacher.userId?.email,
    gender: teacher.userId?.gender,
    country: teacher.userId?.country,
    profilePicture: teacher.userId?.profilePicture,
    specialization: teacher.specialization,
    bio: teacher.bio,
    experience: teacher.experience,
    subjects: teacher.subjects,
    highestDegree: teacher.highestDegree,
    sessionPrice: teacher.sessionPrice,
    currency: teacher.currency,
    performance: teacher.performance,
    isVerified: teacher.isVerified,
    // We can include a simplified view of the academy if needed, or just the ID
    academyName: teacher.academyId?.academyName, // Assuming academyId is populated as 'academy' and has academyName
    academyId: teacher.academyId?._id, // Keep the ID if needed for frontend to fetch full academy details
  };

  return teacherDetails;
}

/* Helper functions to build match and pipeline */
function buildTeacherMatch({ specialization, rating, minPrice, maxPrice }) {
  const match = {
    isVerified: true,
    teacherType: "freelance",
  };
  if (specialization) {
    match.specialization = {
      $in: specialization.split(",").map((s) => s.trim()),
    };
  }
  if (rating) {
    match["performance.rating"] = { $gte: Number(rating) };
  }
  if (minPrice || maxPrice) {
    match.$expr = {
      $and: [
        minPrice
          ? { $gte: [{ $toDouble: "$sessionPrice" }, Number(minPrice)] }
          : {},
        maxPrice
          ? { $lte: [{ $toDouble: "$sessionPrice" }, Number(maxPrice)] }
          : {},
      ].filter(Boolean),
    };
  }
  return match;
}

function buildTeacherPipeline({
  match,
  name,
  gender,
  country,
  halqaType,
  skip,
  limit,
}) {
  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
  ];
  if (name) {
    const regex = new RegExp(name, "i");
    pipeline.push({
      $match: {
        $or: [{ "user.firstName": regex }, { "user.lastName": regex }],
      },
    });
  }
  if (gender) {
    pipeline.push({ $match: { "user.gender": gender } });
  }
  if (country) {
    pipeline.push({ $match: { "user.country": country } });
  }
  if (halqaType) {
    pipeline.push({
      $lookup: {
        from: "halakas",
        let: { teacherId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$teacher", "$$teacherId"] },
                  { $eq: ["$halqaType", halqaType] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "halakasMatch",
      },
    });
    pipeline.push({ $match: { "halakasMatch.0": { $exists: true } } });
  }
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });
  pipeline.push({
    $project: {
      _id: 1,
      userId: 1,
      specialization: 1,
      sessionPrice: 1,
      currency: 1,
      performance: 1,
      bio: 1,
      isVerified: 1,
      user: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        gender: 1,
        country: 1,
        profilePicture: 1,
      },
    },
  });
  return pipeline;
}
