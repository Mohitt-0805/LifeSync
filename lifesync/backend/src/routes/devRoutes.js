import { Router } from "express";
import { triggerDeadlineReminders } from "../controllers/devController.js";

const router = Router();

// Dev/debug trigger endpoints
router.post("/trigger-deadline-reminders", triggerDeadlineReminders);

export default router;
