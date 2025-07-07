import { Router } from "express";
import verificationRouter from "./verification/verification.router.js";

const router = Router();

router.use("/verifications", verificationRouter);

export default router;
