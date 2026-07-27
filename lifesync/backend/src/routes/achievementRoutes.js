import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { getAchievements } from "../controllers/achievementController.js";

const router = Router();

router.use(verifyJWT);
router.get("/", getAchievements);

export default router;
