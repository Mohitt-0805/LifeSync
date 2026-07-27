import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validateMiddleware.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  createHabit,
  getHabits,
  toggleHabit,
  deleteHabit,
} from "../controllers/habitController.js";

const router = Router();

// Secure all habit endpoints
router.use(verifyJWT);

const habitValidationRules = [
  body("title").trim().notEmpty().withMessage("Habit title is required"),
  body("frequency")
    .optional()
    .isIn(["daily", "weekly"])
    .withMessage("Invalid frequency mode"),
  body("targetDays")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Target days must be a positive integer"),
];

router.route("/")
  .post(habitValidationRules, validate, createHabit)
  .get(getHabits);

router.route("/:id/toggle")
  .post(toggleHabit);

router.route("/:id")
  .delete(deleteHabit);

export default router;
