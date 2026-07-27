import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { globalSearch } from "../controllers/searchController.js";

const router = Router();

router.use(verifyJWT);
router.get("/", globalSearch);

export default router;
