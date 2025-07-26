import cron from "node-cron";
import Halaka from "../../DB/models/halaka.js";
import Enrollment from "../../DB/models/enrollment.js";
import { sendNotification } from "../services/notification.service.js";
import Student from "../../DB/models/student.js";

/**
 * @desc    The core logic for deducting session credits.
 * This function is separated so it can be called manually for testing.
 * @param {string|null} dateString - An optional date string (YYYY-MM-DD) to simulate running the job on a specific day.
 */
export const runDeductCreditsLogic = async (dateString = null) => {
  console.log(`--- Starting Deduct Session Credits Logic ---`);
  if (dateString) {
    console.log(`--- Running in test mode for date: ${dateString} ---`);
  }

  try {
    // --- IMPROVEMENT: Allow simulating a specific date for testing ---
    // 1. Get the target date (yesterday relative to today or the provided date)
    const today = dateString ? new Date(dateString) : new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - 1); // We are always checking for the day before.

    const targetDayName = targetDate
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();
    const targetDateString = targetDate.toISOString().slice(0, 10); // YYYY-MM-DD format

    console.log(
      `Logic is running for date: ${targetDateString} (Day: ${targetDayName})`
    );

    // 2. Find all active, private halaqas that were scheduled for the target date
    const potentiallyCompletedHalaqas = await Halaka.find({
      status: "active",
      halqaType: "private",
      "schedule.days": targetDayName,
      "schedule.startDate": { $lte: targetDate },
      "schedule.endDate": { $gte: targetDate },
    });
    console.log(potentiallyCompletedHalaqas);
    console.log(
      `Found ${potentiallyCompletedHalaqas.length} private halaqas scheduled for ${targetDateString}.`
    );
    if (potentiallyCompletedHalaqas.length === 0)
      return {
        success: true,
        message: `No applicable halaqas found for ${targetDateString}.`,
      };

    let processedCount = 0;
    for (const halaka of potentiallyCompletedHalaqas) {
      // 3. Check if the session was NOT cancelled
      const wasCancelled = halaka.cancelledSessions.some(
        (session) =>
          session.sessionDate.toISOString().slice(0, 10) === targetDateString
      );
      if (wasCancelled) {
        console.log(
          `Session for halaka ${halaka._id} on ${targetDateString} was cancelled. Skipping.`
        );
        continue;
      }

      // --- Check for an actual attendance record ---
      const attendanceRecord = halaka.attendance.find(
        (att) =>
          att.sessionDate.toISOString().slice(0, 10) === targetDateString &&
          att.records.some(
            (rec) =>
              rec.student.toString() === halaka.student.toString() &&
              rec.status === "present"
          )
      );

      if (!attendanceRecord) {
        console.log(
          `No 'present' attendance record found for student in halaka ${halaka._id} on ${targetDateString}. Skipping.`
        );
        continue;
      }

      // 4. Find the corresponding enrollment
      const enrollment = await Enrollment.findOne({
        halaka: halaka._id,
        student: halaka.student,
        status: "active",
      });

      if (enrollment && enrollment.sessionsRemaining > 0) {
        enrollment.sessionsRemaining -= 1;

        if (enrollment.sessionsRemaining === 0) {
          enrollment.status = "no_balance";

          const studentProfile = await Student.findById(
            enrollment.student
          ).select("user");
          if (studentProfile) {
            await sendNotification({
              recipient: studentProfile.user,
              type: "system_alert",
              message: `Your session package for "${halaka.title}" has run out. Please purchase a new package to continue.`,
              link: `/checkout/${enrollment._id}`,
            });
          }
        }
        await enrollment.save();
        processedCount++;
        console.log(
          `Deducted 1 session from enrollment ${enrollment._id}. Remaining: ${enrollment.sessionsRemaining}`
        );
      }

      //  --- IMPROVEMENT: Release funds from pending balance if applicable ---
      try {
        const halaka = await Halaka.findById(enrollment.halaka).select(
          "totalSessions totalPrice"
        );
        const enrollmentSnapshot = enrollment.snapshot;

        // Calculate the value of one session
        const totalNetAmount = enrollmentSnapshot.totalPrice * (1 - 0.05); // Assume 5% fee
        const singleSessionValue = totalNetAmount / halaka.totalSessions;

        // Move the value from pending to available balance
        await TeacherWallet.findOneAndUpdate(
          { teacher: halaka.teacher },
          {
            $inc: {
              balance: singleSessionValue, // Add to available balance
              pendingBalance: -singleSessionValue, // Subtract from pending balance
            },
          }
        );
        console.log(
          `Released ${singleSessionValue} EGP to teacher's available balance.`
        );
      } catch (e) {
        console.error("Error releasing funds from pending balance:", e);
      }
    }
    return {
      success: true,
      message: `Processed ${processedCount} enrollments.`,
    };
  } catch (error) {
    console.error("--- Cron Job Logic Error ---", error);
    throw error; // Throw error to be caught by the calling function
  }
};

/**
 * @desc    Schedules the deductSessionCreditsJob to run automatically.
 */
export const scheduleDeductCreditsJob = () => {
  cron.schedule(
    "0 1 * * *",
    async () => {
      console.log(
        "--- Cron Job: Starting Scheduled Deduct Session Credits ---"
      );
      // The scheduled job runs without a date, so it always uses the real "yesterday"
      await runDeductCreditsLogic();
      console.log(
        "--- Cron Job: Finished Scheduled Deduct Session Credits ---"
      );
    },
    {
      scheduled: true,
      timezone: "Africa/Cairo",
    }
  );
};

