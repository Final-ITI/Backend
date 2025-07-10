import Halaka from "../../../DB/models/halaka.js";
import {
  created,
  error,
  validationError,
  success,
  notFound,
} from "../../utils/apiResponse.js";
import Teacher from "../../../DB/models/teacher.js";
import Session from "../../../DB/models/session.js";

//teacher
export const createHalaka = async (req, res) => {
  try {
    const {
      title,
      description,
      halqaType,
      student,
      schedule,
      curriculum,
      maxStudents,
      price,
    } = req.body;

    // Validation
    if (!title || !halqaType || !schedule || !curriculum || !price) {
      return validationError(res, [
        "Missing required fields: title, halqaType, schedule, curriculum, price",
      ]);
    }
    if (halqaType === "private" && !student) {
      return validationError(res, ["student is required for private halaka"]);
    }
    if (halqaType === "halqa" && !maxStudents) {
      return validationError(res, ["maxStudents is required for group halaka"]);
    }
    console.log(req.user);

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "Teacher not found ", 403);
    }

    // Prepare data
    const halakaData = {
      title,
      description,
      teacher: teacher._id,
      halqaType,
      schedule,
      curriculum,
      price,
      status: "scheduled",
    };
    if (halqaType === "private") {
      halakaData.student = student;
      halakaData.maxStudents = 1;
      halakaData.currentStudents = 1;
    } else {
      halakaData.maxStudents = maxStudents;
      halakaData.currentStudents = 0;
    }

    // Save Halaka
    const halaka = new Halaka(halakaData);
    await halaka.save();

    return created(res, halaka, "Halaka created successfully");
  } catch (err) {
    console.error("❌ Create Halaka Error:", err);
    return error(res, "Server error", 500, err);
  }
};

export const updateHalaka = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "Teacher not found", 403);
    }

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka) return notFound(res, "Halaka not found");

    const allowedFields = [
      "title",
      "description",
      "schedule",
      "curriculum",
      "maxStudents",
      "price",
      "status",
    ];
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) halaka[key] = req.body[key];
    }

    await halaka.save();
    return success(res, halaka, "Halaka updated successfully");
  } catch (err) {
    return error(res, "Failed to update Halaka", 500, err);
  }
};

export const getAllHalakat = async (req, res) => {
  try {
    const filter = {};
    if (req.query.teacher) filter.teacher = req.query.teacher;
    if (req.query.status) filter.status = req.query.status;

    const halakat = await Halaka.find(filter)
      .populate("teacher")
      .sort({ createdAt: -1 });
    return success(res, halakat, "Halakat fetched successfully");
  } catch (err) {
    return error(res, "Failed to fetch Halakat", 500, err);
  }
};

export const getHalakaById = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "Teacher not found", 403);
    }

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    }).populate("teacher");
    if (!halaka) return notFound(res, "Halaka not found or not yours");
    return success(res, halaka, "Halaka fetched successfully");
  } catch (err) {
    return error(res, "Failed to fetch Halaka", 500, err);
  }
};

export const deleteHalaka = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "Teacher not found", 403);
    }

    const halaka = await Halaka.findOne({
      _id: req.params.id,
      teacher: teacher._id,
    });
    if (!halaka) return notFound(res, "Halaka not found or not yours");

    await Session.deleteMany({ halaka: halaka._id });
    await Teacher.findByIdAndUpdate(halaka.teacher, {
      $pull: { halakat: halaka._id },
    });
    await halaka.deleteOne();

    return success(
      res,
      null,
      "Halaka and all related data deleted successfully"
    );
  } catch (err) {
    return error(res, "Failed to delete Halaka", 500, err);
  }
};

export const getHalakatByTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return error(res, "Teacher not found", 403);
    }

    const halakat = await Halaka.find({ teacher: teacher._id })
      .populate("teacher")
      .sort({ createdAt: -1 });
    return success(res, halakat, "Halakat fetched successfully");
  } catch (err) {
    return error(res, "Failed to fetch Halakat", 500, err);
  }
};
