import express from "express";
import {
  createHalaka,
  getAllHalakat,
  getHalakaById,
  updateHalaka,
  deleteHalaka,
  getHalakatByTeacher,
} from "./halaka.controller.js";
import {
  createHalakaValidation,
  updateHalakaValidation,
} from "./halaka.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";
const router = express.Router();

router.post("/", validate(createHalakaValidation), createHalaka);
router.get("/", getAllHalakat);
router.get("/:id", getHalakaById);
router.put("/:id", validate(updateHalakaValidation), updateHalaka);
router.delete("/:id", deleteHalaka);
router.get("/teacher/:teacherId", getHalakatByTeacher);

export default router;
