import { Router } from "express";
import { getFreelanceTeachers } from "./teacher.controller.js";

const router = Router();

router.get("/", getFreelanceTeachers);

export default router;
