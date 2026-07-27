import { Task } from "../models/Task.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rewardXP, deductXP, checkAndUnlockAchievement } from "../utils/gamification.js";

// Create Task
const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, category, dueDate, tags } = req.body;

  if (!title) {
    throw new ApiError(400, "Task title is required");
  }

  const task = await Task.create({
    user: req.user._id,
    title,
    description,
    priority,
    category,
    dueDate,
    tags: tags || [],
  });

  // Track task creation achievement checking
  const totalTasks = await Task.countDocuments({ user: req.user._id });
  if (totalTasks === 1) {
    await checkAndUnlockAchievement(req.user._id, "first_task", "Initiator", "Created your very first task!", "CheckSquare");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully"));
});

// Get Tasks (with Pagination, Filter & Sort)
const getTasks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    category,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = { user: req.user._id };

  // Apply filters
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Pagination setups
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const sortOption = { [sortBy]: sortDirection };

  const totalTasks = await Task.countDocuments(query);
  const tasks = await Task.find(query)
    .sort(sortOption)
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        tasks,
        pagination: {
          total: totalTasks,
          page: options.page,
          limit: options.limit,
          totalPages: Math.ceil(totalTasks / options.limit),
        },
      },
      "Tasks retrieved successfully"
    )
  );
});

// Update Task
const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, category, dueDate, tags } = req.body;

  const task = await Task.findOne({ _id: id, user: req.user._id });

  if (!task) {
    throw new ApiError(404, "Task not found or access denied");
  }

  const oldStatus = task.status;

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (category !== undefined) task.category = category;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (tags !== undefined) task.tags = tags;

  let xpRewardResult = null;
  if (status !== undefined && status !== oldStatus) {
    task.status = status;
    if (status === "completed") {
      task.completedAt = new Date();
      // Reward 10 XP
      xpRewardResult = await rewardXP(
        req.user._id,
        10,
        "task_completed",
        "tasks",
        `Completed task: "${task.title}"`
      );

      // Task milestones achievements
      const completedCount = await Task.countDocuments({ user: req.user._id, status: "completed" });
      if (completedCount === 10) {
        await checkAndUnlockAchievement(req.user._id, "tasks_10", "Taskmaster", "Completed 10 tasks!", "CheckSquare");
      }
    } else if (oldStatus === "completed" && status !== "completed") {
      task.completedAt = undefined;
      // Deduct 10 XP
      await deductXP(
        req.user._id,
        10,
        "task_uncompleted",
        "tasks",
        `Uncompleted task: "${task.title}"`
      );
    }
  }

  await task.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        task,
        xpInfo: xpRewardResult ? {
          leveledUp: xpRewardResult.leveledUp,
          xpGained: 10,
          currentLevel: xpRewardResult.user.level,
          currentXp: xpRewardResult.user.xp,
        } : null,
      },
      "Task updated successfully"
    )
  );
});

// Delete Task
const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findOneAndDelete({ _id: id, user: req.user._id });

  if (!task) {
    throw new ApiError(404, "Task not found or access denied");
  }

  // If deleted task was completed, deduct XP
  if (task.status === "completed") {
    await deductXP(
      req.user._id,
      10,
      "task_deleted",
      "tasks",
      `Deleted completed task: "${task.title}"`
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Task deleted successfully"));
});

export { createTask, getTasks, updateTask, deleteTask };
