// In src/controllers/test.controller.js
import { asyncHandler } from '../../utils/apiError.js';
import { success } from '../../utils/apiResponse.js';
import { runDeductCreditsLogic } from '../../cron/jobs.js'; // Import the logic function

export const triggerDeductJob = asyncHandler(async (req, res) => {
    console.log("--- Received request to manually trigger deduct job ---");
    const result = await runDeductCreditsLogic(req.body.date);
    return success(res, result, "Deduct credits job executed successfully.");
});