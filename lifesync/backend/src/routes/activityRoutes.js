import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { getActivities } from "../controllers/activityController.js";

const router = Router();

router.use(verifyJWT);
router.get("/", getActivities);

export default router;
