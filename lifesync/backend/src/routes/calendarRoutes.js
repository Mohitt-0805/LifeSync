import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { getUnifiedCalendar } from "../controllers/calendarController.js";

const router = Router();

// Secure endpoint with JWT verification
router.use(verifyJWT);

router.get("/", getUnifiedCalendar);

export default router;
