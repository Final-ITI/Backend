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
import { authorize } from "../../middlewares/auth.middleware.js";
const router = express.Router();

router.post(
  "/",
  authorize("teacher"),
  validate(createHalakaValidation),
  createHalaka
);
router.get("/", getAllHalakat);
router.get("/:id", getHalakaById);
router.put(
  "/:id",
  authorize("teacher", "superadmin"),
  validate(updateHalakaValidation),
  updateHalaka
);
router.delete("/:id", authorize("teacher", "superadmin"), deleteHalaka);
router.get(
  "/teacher/:teacherId",
  authorize("teacher", "admin"),
  getHalakatByTeacher
);

export default router;
