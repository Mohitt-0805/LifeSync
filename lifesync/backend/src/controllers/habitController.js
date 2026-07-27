import { Habit } from "../models/Habit.js";
import { HabitLog } from "../models/HabitLog.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rewardXP, deductXP, checkAndUnlockAchievement } from "../utils/gamification.js";

// Helper: Get YYYY-MM-DD for a Date object
const formatDateString = (date) => {
  const d = new Date(date);
  let month = "" + (d.getMonth() + 1);
  let day = "" + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
};

// Helper: Get Date offset by days
const getOffsetDate = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// Create Habit
const createHabit = asyncHandler(async (req, res) => {
  const { title, description, frequency, targetDays } = req.body;

  if (!title) {
    throw new ApiError(400, "Habit title is required");
  }

  const habit = await Habit.create({
    user: req.user._id,
    title,
    description,
    frequency,
    targetDays: targetDays || 1,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, habit, "Habit created successfully"));
});

// Get Habits & Log completion statuses for today
const getHabits = asyncHandler(async (req, res) => {
  const habits = await Habit.find({ user: req.user._id });
  const todayStr = formatDateString(new Date());

  // Find all logs for today
  const logsToday = await HabitLog.find({
    user: req.user._id,
    date: todayStr,
  });

  const logMap = {};
  logsToday.forEach((log) => {
    logMap[log.habit.toString()] = log.status;
  });

  // Attach status and all historical logs for heatmaps
  const habitsWithStatus = await Promise.all(
    habits.map(async (habit) => {
      const allLogs = await HabitLog.find({ habit: habit._id }).select("date status");
      return {
        ...(typeof habit.toObject === "function" ? habit.toObject() : { ...habit }),
        isCompletedToday: logMap[habit._id.toString()] === "completed",
        logs: allLogs,
      };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, habitsWithStatus, "Habits retrieved successfully"));
});

// Log/Toggle Habit Completion & Calculate Streaks
const toggleHabit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.body; // Expects YYYY-MM-DD
  const targetDateStr = date || formatDateString(new Date());

  const habit = await Habit.findOne({ _id: id, user: req.user._id });
  if (!habit) {
    throw new ApiError(404, "Habit not found or access denied");
  }

  // Check if log already exists for this date
  const existingLog = await HabitLog.findOne({ habit: habit._id, date: targetDateStr });

  let xpRewardResult = null;

  if (existingLog) {
    // UNCHECK habit (delete log)
    await HabitLog.findByIdAndDelete(existingLog._id);

    // Re-evaluate streak from logs
    const yesterdayStr = formatDateString(getOffsetDate(new Date(targetDateStr), -1));
    const wasYesterdayCompleted = await HabitLog.findOne({
      habit: habit._id,
      date: yesterdayStr,
      status: "completed",
    });

    if (wasYesterdayCompleted) {
      // Restore yesterday's streak (estimate from logs recursively or just check yesterday's log)
      // For simplicity, find the consecutive completed logs backward
      let currentStreak = 0;
      let checkDate = getOffsetDate(new Date(targetDateStr), -1);
      while (true) {
        const log = await HabitLog.findOne({
          habit: habit._id,
          date: formatDateString(checkDate),
          status: "completed",
        });
        if (!log) break;
        currentStreak++;
        checkDate = getOffsetDate(checkDate, -1);
      }
      habit.streak = currentStreak;
    } else {
      habit.streak = 0;
    }

    await habit.save();

    // Deduct 15 XP
    await deductXP(
      req.user._id,
      15,
      "habit_uncompleted",
      "habits",
      `Unchecked habit log: "${habit.title}"`
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        { habit, isCompletedToday: false },
        "Habit completion log deleted successfully"
      )
    );
  } else {
    // CHECK habit (create log)
    await HabitLog.create({
      habit: habit._id,
      user: req.user._id,
      date: targetDateStr,
      status: "completed",
    });

    // Calculate streak
    const yesterdayStr = formatDateString(getOffsetDate(new Date(targetDateStr), -1));
    const wasYesterdayCompleted = await HabitLog.findOne({
      habit: habit._id,
      date: yesterdayStr,
      status: "completed",
    });

    if (wasYesterdayCompleted) {
      habit.streak += 1;
    } else {
      habit.streak = 1; // start new streak
    }

    if (habit.streak > habit.bestStreak) {
      habit.bestStreak = habit.streak;
    }

    await habit.save();

    // Award 15 XP
    xpRewardResult = await rewardXP(
      req.user._id,
      15,
      "habit_completed",
      "habits",
      `Logged habit: "${habit.title}" (Streak: ${habit.streak})`
    );

    // Habit achievements checks
    if (habit.streak === 5) {
      await checkAndUnlockAchievement(req.user._id, "habit_streak_5", "Consistent Builder", "Maintained a habit streak for 5 days!", "Flame");
    } else if (habit.streak === 30) {
      await checkAndUnlockAchievement(req.user._id, "habit_streak_30", "Iron Will", "Maintained a habit streak for 30 days!", "Flame");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          habit,
          isCompletedToday: true,
          xpInfo: xpRewardResult ? {
            leveledUp: xpRewardResult.leveledUp,
            xpGained: 15,
            currentLevel: xpRewardResult.user.level,
            currentXp: xpRewardResult.user.xp,
          } : null,
        },
        "Habit completion logged successfully"
      )
    );
  }
});

// Delete Habit
const deleteHabit = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const habit = await Habit.findOneAndDelete({ _id: id, user: req.user._id });
  if (!habit) {
    throw new ApiError(404, "Habit not found or access denied");
  }

  // Clear logs
  await HabitLog.deleteMany({ habit: id });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Habit deleted successfully"));
});

export { createHabit, getHabits, toggleHabit, deleteHabit };
