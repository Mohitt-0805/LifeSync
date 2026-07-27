import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { runDeadlineReminders } from "../cron/deadlineReminder.cron.js";

/**
 * Dev-only / Debug endpoint to trigger deadline reminders cron on demand.
 */
export const triggerDeadlineReminders = asyncHandler(async (req, res) => {
  const summary = await runDeadlineReminders();

  return res.status(200).json(
    new ApiResponse(
      200,
      summary,
      "Deadline reminders executed successfully on demand"
    )
  );
});
