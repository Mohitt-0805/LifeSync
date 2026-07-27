import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  startFocusSession,
  completeFocusSession,
  getTodaySummary,
  getWeekSummary,
} from "../controllers/focusController.js";

const router = Router();

router.use(verifyJWT);

router.post("/start", startFocusSession);
router.post("/:id/complete", completeFocusSession);
router.get("/today-summary", getTodaySummary);
router.get("/week-summary", getWeekSummary);

export default router;
