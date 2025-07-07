import express from "express";
import { generateZoomSignature } from "./zoom.signature.js";
import { created, error } from "../../utils/apiResponse.js";

const router = express.Router();

router.post("/signature", (req, res) => {
  const { meetingNumber, role } = req.body;

  if (!meetingNumber || typeof role !== "number") {
    return error(res, "meetingNumber and role are required", 400);
  }

  const signature = generateZoomSignature(meetingNumber, role);
  created(res, { signature }, "Zoom signature generated successfully");
});

export default router;
