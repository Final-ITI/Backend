import Teacher from "../../../DB/models/teacher.js";


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
