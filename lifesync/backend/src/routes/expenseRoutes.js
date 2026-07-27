import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validateMiddleware.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  createExpense,
  getExpenses,
  deleteExpense,
  createBudget,
  getBudgets,
  getExpenseStats,
} from "../controllers/expenseController.js";

const router = Router();

// Secure all expense endpoints
router.use(verifyJWT);

const expenseValidationRules = [
  body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),
  body("type").isIn(["income", "expense"]).withMessage("Invalid transaction type"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("date").optional().isISO8601().toDate().withMessage("Invalid date format"),
];

const budgetValidationRules = [
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),
  body("period").optional().isIn(["weekly", "monthly"]).withMessage("Invalid period"),
];

router.route("/")
  .post(expenseValidationRules, validate, createExpense)
  .get(getExpenses);

router.route("/stats")
  .get(getExpenseStats);

router.route("/budgets")
  .post(budgetValidationRules, validate, createBudget)
  .get(getBudgets);

router.route("/:id")
  .delete(deleteExpense);

export default router;
