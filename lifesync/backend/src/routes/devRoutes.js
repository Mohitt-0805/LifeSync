import { Router } from "express";
import { triggerDeadlineReminders } from "../controllers/devController.js";

const router = Router();

// Dev/debug trigger endpoints (supports both GET and POST for cron pingers)
router.get("/run-deadline-cron", triggerDeadlineReminders);
router.post("/run-deadline-cron", triggerDeadlineReminders);
router.get("/trigger-deadline-reminders", triggerDeadlineReminders);
router.post("/trigger-deadline-reminders", triggerDeadlineReminders);

export default router;
