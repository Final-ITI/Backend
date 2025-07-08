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
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("teacher"),
  validate(createHalakaValidation),
  createHalaka
);
router.get("/", getAllHalakat);
router.get("/:id", getHalakaById);
router.put(
  "/:id",
  authenticate,
  authorize("teacher", "superadmin"),
  validate(updateHalakaValidation),
  updateHalaka
);
router.delete("/:id", authenticate,authorize("teacher", "superadmin"), deleteHalaka);
router.get(
  "/teacher/:teacherId",
  authenticate,
  authorize("teacher", "admin"),
  getHalakatByTeacher
);

export default router;
