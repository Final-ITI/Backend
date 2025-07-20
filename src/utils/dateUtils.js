import { DateTime } from "luxon";

/**
 * Check if the enrollment for a halaka is closed based on the schedule.
 * @param {Object} schedule - The schedule object from the halaka.
 * @param {string} schedule.startDate - ISO string of the start date.
 * @param {Array} schedule.days - Array of days with startTime, duration, etc.
 * @param {string} schedule.timezone - Timezone string (e.g., "Africa/Cairo")
 * @param {Date} [now=new Date()] - Optional current date to use (for testing or overriding).
 * @returns {boolean} - True if enrollment is closed, false otherwise.
 */
export function isHalakaEnrollmentClosed(schedule, now = new Date()) {
  const currentDate = DateTime.fromJSDate(now).setZone(schedule.timezone || "UTC");

  const startDate = DateTime.fromISO(schedule.startDate, {
    zone: schedule.timezone || "UTC",
  });

  if (!Array.isArray(schedule.days) || schedule.days.length === 0) return false;

  const firstDay = schedule.days[0]; // assume days are sorted by order
  
  if (!firstDay.startTime) return false;
  
  const [hour, minute] = firstDay.startTime.split(":").map(Number);

  const halakaStartDateTime = startDate.set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });

  return currentDate >= halakaStartDateTime;
}
