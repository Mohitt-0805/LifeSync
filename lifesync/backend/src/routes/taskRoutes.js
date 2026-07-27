import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validateMiddleware.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";

const router = Router();

// Secure all task endpoints
router.use(verifyJWT);

const taskValidationRules = [
  body("title").trim().notEmpty().withMessage("Task title is required"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid priority level"),
  body("category")
    .optional()
    .isIn(["academics", "study", "work", "personal", "health", "finance", "other"])
    .withMessage("Invalid category type"),
  body("dueDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage("Invalid due date format"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
];

router.route("/")
  .post(taskValidationRules, validate, createTask)
  .get(getTasks);

router.route("/:id")
  .put(updateTask)
  .delete(deleteTask);

export default router;
