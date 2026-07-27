import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validateMiddleware.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
} from "../controllers/goalController.js";

const router = Router();

// Secure all goal endpoints
router.use(verifyJWT);

const goalValidationRules = [
  body("title").trim().notEmpty().withMessage("Goal title is required"),
  body("category")
    .optional()
    .isIn(["career", "health", "finance", "learning", "relationship", "other"])
    .withMessage("Invalid category type"),
  body("startDate").optional().isISO8601().toDate().withMessage("Invalid start date format"),
  body("targetDate").optional().isISO8601().toDate().withMessage("Invalid target date format"),
  body("milestones").optional().isArray().withMessage("Milestones must be an array"),
];

router.route("/")
  .post(goalValidationRules, validate, createGoal)
  .get(getGoals);

router.route("/:id")
  .put(updateGoal)
  .delete(deleteGoal);

export default router;
