import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getNextClass,
} from "../controllers/classController.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getClasses).post(createClass);
router.route("/next").get(getNextClass);
router.route("/:id").put(updateClass).delete(deleteClass);

export default router;
