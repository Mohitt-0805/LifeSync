import { Expense } from "../models/Expense.js";
import { Budget } from "../models/Budget.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rewardXP, checkAndUnlockAchievement } from "../utils/gamification.js";

// Create Expense / Income
const createExpense = asyncHandler(async (req, res) => {
  const { amount, type, category, description, date } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, "Valid amount is required");
  }
  if (!type || !["income", "expense"].includes(type)) {
    throw new ApiError(400, "Valid transaction type (income/expense) is required");
  }
  if (!category) {
    throw new ApiError(400, "Category is required");
  }

  const transaction = await Expense.create({
    user: req.user._id,
    amount,
    type,
    category,
    description,
    title: description || category || "Expense",
    date: date ? new Date(date) : new Date(),
  });

  // Gamification: log transaction XP reward (+10 XP) for budgeting entry tracking
  const totalEntries = await Expense.countDocuments({ user: req.user._id });
  if (totalEntries === 1) {
    await checkAndUnlockAchievement(req.user._id, "first_expense", "Budget Planner", "Logged your first budget transaction!", "Wallet");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, transaction, "Transaction logged successfully"));
});

// Get Transactions (with Filters, Sort, Pagination)
const getExpenses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    type,
    category,
    sortBy = "date",
    sortOrder = "desc",
  } = req.query;

  const query = { user: req.user._id };

  if (type) query.type = type;
  if (category) query.category = category;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const sortOption = { [sortBy]: sortDirection };

  const total = await Expense.countDocuments(query);
  const transactions = await Expense.find(query)
    .sort(sortOption)
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        transactions,
        pagination: {
          total,
          page: options.page,
          limit: options.limit,
          totalPages: Math.ceil(total / options.limit),
        },
      },
      "Transactions retrieved successfully"
    )
  );
});

// Delete Transaction
const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await Expense.findOneAndDelete({ _id: id, user: req.user._id });
  if (!transaction) {
    throw new ApiError(404, "Transaction not found or access denied");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Transaction deleted successfully"));
});

// Create/Update Budget cap
const createBudget = asyncHandler(async (req, res) => {
  const { category, amount, period } = req.body;

  if (!category || !amount || amount <= 0) {
    throw new ApiError(400, "Valid category and amount are required");
  }

  // Update if exists, otherwise create
  const budget = await Budget.findOneAndUpdate(
    { user: req.user._id, category },
    { amount, period: period || "monthly" },
    { new: true, upsert: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, budget, "Budget set successfully"));
  });

// Get Budget Limits
const getBudgets = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({ user: req.user._id });
  return res
    .status(200)
    .json(new ApiResponse(200, budgets, "Budgets retrieved successfully"));
});

// Get Expense Breakdown Statistics for Recharts
const getExpenseStats = asyncHandler(async (req, res) => {
  const userId = req.user._id?.toString();

  // 1. Group by category (expenses only)
  const categoryStats = await Expense.aggregate([
    { $match: { user: userId, type: "expense" } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $project: { category: "$_id", total: 1, _id: 0 } },
    { $sort: { total: -1 } },
  ]);

  // 2. Group by type (income vs expense totals)
  const typeStats = await Expense.aggregate([
    { $match: { user: userId } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
    { $project: { type: "$_id", total: 1, _id: 0 } },
  ]);

  // 3. Monthly trend stats (over the last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyTrend = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Process type totals
  let totalIncome = 0;
  let totalExpense = 0;
  typeStats.forEach((t) => {
    if (t.type === "income") totalIncome = t.total;
    if (t.type === "expense") totalExpense = t.total;
  });

  // Calculate current month's expenses per category for budget warnings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const currentMonthExpenses = await Expense.aggregate([
    { $match: { user: userId, type: "expense", date: { $gte: startOfMonth } } },
    { $group: { _id: "$category", spent: { $sum: "$amount" } } },
  ]);

  const budgets = await Budget.find({ user: userId });
  const budgetWarnings = [];

  currentMonthExpenses.forEach((item) => {
    const budget = budgets.find((b) => b.category === item._id || b.category === "all");
    if (budget && item.spent > budget.amount) {
      budgetWarnings.push({
        category: item._id,
        limit: budget.amount,
        spent: item.spent,
        message: `Warning: You have exceeded your ₹${budget.amount} budget for ${item._id}! Spent: ₹${item.spent}`,
      });
    }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        categoryStats,
        totals: { income: totalIncome, expense: totalExpense, balance: totalIncome - totalExpense },
        monthlyTrend,
        budgetWarnings,
      },
      "Expense stats compiled successfully"
    )
  );
});

export { createExpense, getExpenses, deleteExpense, createBudget, getBudgets, getExpenseStats };
