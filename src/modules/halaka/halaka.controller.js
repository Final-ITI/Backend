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
      teacher,
      halqaType,
      student,
      schedule,
      curriculum,
      maxStudents,
      price,
    } = req.body;

    // Validation
    if (
      !title ||
      !teacher ||
      !halqaType ||
      !schedule ||
      !curriculum ||
      !price
    ) {
      return validationError(res, [
        "Missing required fields: title, teacher, halqaType, schedule, curriculum, price",
      ]);
    }
    if (halqaType === "private" && !student) {
      return validationError(res, ["student is required for private halaka"]);
    }
    if (halqaType === "halqa" && !maxStudents) {
      return validationError(res, ["maxStudents is required for group halaka"]);
    }

    // Prepare data
    const halakaData = {
      title,
      description,
      teacher,
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
    const allowedFields = [
      "title",
      "description",
      "schedule",
      "curriculum",
      "maxStudents",
      "price",
      "status",
    ];
    const updateData = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }

    if (Object.keys(updateData).length === 0) {
      return validationError(res, ["No valid fields provided for update"]);
    }

    const halaka = await Halaka.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!halaka) return notFound(res, "Halaka not found");
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
    const halaka = await Halaka.findById(req.params.id).populate("teacher");
    if (!halaka) return notFound(res, "Halaka not found");
    return success(res, halaka, "Halaka fetched successfully");
  } catch (err) {
    return error(res, "Failed to fetch Halaka", 500, err);
  }
};

export const deleteHalaka = async (req, res) => {
  try {
    const halaka = await Halaka.findById(req.params.id);
    if (!halaka) return notFound(res, "Halaka not found");

    // 1. Delete all sessions related to this Halaka
    await Session.deleteMany({ halaka: halaka._id });
    console.log("sessions deleted successfully");
    // 2. Remove Halaka ID from teacher's halakat array
    await Teacher.findByIdAndUpdate(halaka.teacher, {
      $pull: { halakat: halaka._id },
    });
    console.log("teacher's halakat updated successfully");
    // 3. Delete the Halaka itself
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
    const halakat = await Halaka.find({ teacher: req.params.teacherId })
      .populate("teacher")
      .sort({ createdAt: -1 });
    return success(res, halakat, "Halakat fetched successfully");
  } catch (err) {
    return error(res, "Failed to fetch Halakat", 500, err);
  }
};
