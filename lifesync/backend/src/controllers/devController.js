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

export const testEmail = asyncHandler(async (req, res) => {
  const targetEmail = req.query.to || req.body.to || process.env.SMTP_USER;
  const { sendOtpEmail } = await import("../utils/mail.js");

  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();

  const envCheck = {
    SMTP_HOST: process.env.SMTP_HOST || "NOT SET",
    SMTP_PORT: process.env.SMTP_PORT || "NOT SET (defaults to 587)",
    SMTP_USER: process.env.SMTP_USER || "NOT SET",
    SMTP_PASS: process.env.SMTP_PASS ? "SET (length: " + process.env.SMTP_PASS.length + ")" : "NOT SET",
    FROM_EMAIL: process.env.FROM_EMAIL || "NOT SET",
  };

  try {
    const result = await sendOtpEmail(targetEmail, testOtp, "Test Verification");
    return res.status(200).json(
      new ApiResponse(
        200,
        { targetEmail, testOtp, envCheck, result },
        "Test email dispatch executed. Check result object and target inbox."
      )
    );
  } catch (err) {
    return res.status(500).json(
      new ApiResponse(
        500,
        { targetEmail, envCheck, error: err.message || String(err) },
        "Test email dispatch threw an error."
      )
    );
  }
});
