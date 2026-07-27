import { Goal } from "../models/Goal.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rewardXP, deductXP, checkAndUnlockAchievement } from "../utils/gamification.js";

// Create Goal
const createGoal = asyncHandler(async (req, res) => {
  const { title, description, category, startDate, targetDate, milestones } = req.body;

  if (!title) {
    throw new ApiError(400, "Goal title is required");
  }

  // Map milestones if provided
  const formattedMilestones = milestones
    ? milestones.map((m) => ({ title: m.title || m }))
    : [];

  const goal = await Goal.create({
    user: req.user._id,
    title,
    description,
    category,
    startDate,
    targetDate,
    milestones: formattedMilestones,
    progress: 0,
    status: "not_started",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, goal, "Goal created successfully"));
});

// Get Goals
const getGoals = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = { user: req.user._id };

  if (status) query.status = status;
  if (category) query.category = category;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const sortOption = { [sortBy]: sortDirection };

  const totalGoals = await Goal.countDocuments(query);
  const goals = await Goal.find(query)
    .sort(sortOption)
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        goals,
        pagination: {
          total: totalGoals,
          page: options.page,
          limit: options.limit,
          totalPages: Math.ceil(totalGoals / options.limit),
        },
      },
      "Goals retrieved successfully"
    )
  );
});

// Update Goal / Milestones & Recalculate Progress & Gamify XP
const updateGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, status, category, targetDate, milestones } = req.body;

  const goal = await Goal.findOne({ _id: id, user: req.user._id });

  if (!goal) {
    throw new ApiError(404, "Goal not found or access denied");
  }

  const oldStatus = goal.status;
  const oldProgress = goal.progress;

  if (title !== undefined) goal.title = title;
  if (description !== undefined) goal.description = description;
  if (category !== undefined) goal.category = category;
  if (targetDate !== undefined) goal.targetDate = targetDate;

  let totalXpGained = 0;
  let leveledUp = false;

  // Process Milestones if updating them
  if (milestones !== undefined) {
    const previousMilestoneStatus = goal.milestones.map((m) => ({
      id: m._id?.toString(),
      isCompleted: m.isCompleted,
    }));

    // Keep track of new milestones, formatting them
    const newMilestones = [];
    for (const m of milestones) {
      if (m._id) {
        // Existing milestone
        const oldM = goal.milestones.id(m._id);
        if (oldM) {
          const oldMComplete = oldM.isCompleted;
          oldM.title = m.title || oldM.title;
          
          if (m.isCompleted !== undefined && m.isCompleted !== oldMComplete) {
            oldM.isCompleted = m.isCompleted;
            if (m.isCompleted) {
              oldM.completedAt = new Date();
              // Award 25 XP
              const xpRes = await rewardXP(
                req.user._id,
                25,
                "milestone_completed",
                "goals",
                `Completed milestone: "${oldM.title}"`
              );
              if (xpRes) {
                totalXpGained += 25;
                if (xpRes.leveledUp) leveledUp = true;
              }
            } else {
              oldM.completedAt = undefined;
              // Deduct 25 XP
              await deductXP(
                req.user._id,
                25,
                "milestone_uncompleted",
                "goals",
                `Uncompleted milestone: "${oldM.title}"`
              );
              totalXpGained -= 25;
            }
          }
          newMilestones.push(oldM);
        }
      } else {
        // Brand new milestone
        newMilestones.push({
          title: m.title || m,
          isCompleted: !!m.isCompleted,
          completedAt: m.isCompleted ? new Date() : undefined,
        });
        if (m.isCompleted) {
          const xpRes = await rewardXP(
            req.user._id,
            25,
            "milestone_completed",
            "goals",
            `Completed milestone: "${m.title || m}"`
          );
          if (xpRes) {
            totalXpGained += 25;
            if (xpRes.leveledUp) leveledUp = true;
          }
        }
      }
    }

    goal.milestones = newMilestones;

    // Recalculate progress percentage
    if (goal.milestones.length > 0) {
      const completedCount = goal.milestones.filter((m) => m.isCompleted).length;
      goal.progress = Math.round((completedCount / goal.milestones.length) * 100);
    } else {
      goal.progress = 0;
    }
  }

  // Handle auto-completion of goal if progress hits 100%
  if (goal.progress === 100 && oldProgress < 100 && goal.status !== "completed") {
    goal.status = "completed";
    // Award 100 XP
    const xpRes = await rewardXP(
      req.user._id,
      100,
      "goal_completed",
      "goals",
      `Achieved goal: "${goal.title}"`
    );
    if (xpRes) {
      totalXpGained += 100;
      if (xpRes.leveledUp) leveledUp = true;
    }

    // Goal achievements checks
    const totalGoalsCompleted = await Goal.countDocuments({ user: req.user._id, status: "completed" });
    if (totalGoalsCompleted === 1) {
      await checkAndUnlockAchievement(req.user._id, "first_goal", "Overachiever", "Achieved your first full goal!", "Target");
    }
  } else if (goal.progress < 100 && oldProgress === 100 && goal.status === "completed") {
    // If progress drops back, demote status to in_progress
    goal.status = "in_progress";
    await deductXP(
      req.user._id,
      100,
      "goal_uncompleted",
      "goals",
      `Goal reverted: "${goal.title}"`
    );
    totalXpGained -= 100;
  }

  // Handle explicit status changes
  if (status !== undefined && status !== oldStatus) {
    goal.status = status;
    if (status === "completed" && oldStatus !== "completed") {
      // Force progress to 100% and complete all milestones if not done
      goal.progress = 100;
      goal.milestones.forEach((m) => {
        if (!m.isCompleted) {
          m.isCompleted = true;
          m.completedAt = new Date();
          totalXpGained += 25; // reward milestones too
        }
      });
      
      const xpRes = await rewardXP(
        req.user._id,
        100,
        "goal_completed",
        "goals",
        `Achieved goal: "${goal.title}"`
      );
      if (xpRes) {
        totalXpGained += 100;
        if (xpRes.leveledUp) leveledUp = true;
      }
    } else if (oldStatus === "completed" && status !== "completed") {
      // If marking back to in_progress, deduct XP
      await deductXP(
        req.user._id,
        100,
        "goal_uncompleted",
        "goals",
        `Goal reverted: "${goal.title}"`
      );
      totalXpGained -= 100;
    }
  }

  await goal.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        goal,
        xpInfo: totalXpGained !== 0 ? {
          leveledUp,
          xpGained: totalXpGained,
          currentLevel: req.user.level,
        } : null,
      },
      "Goal updated successfully"
    )
  );
});

// Delete Goal
const deleteGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const goal = await Goal.findOneAndDelete({ _id: id, user: req.user._id });

  if (!goal) {
    throw new ApiError(404, "Goal not found or access denied");
  }

  // Deduct XP if deleting a completed goal
  if (goal.status === "completed") {
    await deductXP(
      req.user._id,
      100,
      "goal_deleted",
      "goals",
      `Deleted completed goal: "${goal.title}"`
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Goal deleted successfully"));
});

export { createGoal, getGoals, updateGoal, deleteGoal };
