import { FocusSession } from "../models/FocusSession.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rewardXP, checkAndUnlockAchievement } from "../utils/gamification.js";

// POST /api/v1/focus/start
export const startFocusSession = asyncHandler(async (req, res) => {
  const { durationMinutes = 25, linkedTaskId } = req.body;

  const session = await FocusSession.create({
    user: req.user._id,
    startedAt: new Date(),
    durationMinutes: parseInt(durationMinutes, 10) || 25,
    completed: false,
    linkedTaskId: linkedTaskId || null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, session, "Focus session started"));
});

// POST /api/v1/focus/:id/complete
export const completeFocusSession = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await FocusSession.findOne({ _id: id, user: req.user._id });
  if (!session) {
    throw new ApiError(404, "Focus session not found");
  }

  if (session.completed) {
    return res
      .status(200)
      .json(new ApiResponse(200, { session, xpInfo: null }, "Focus session already completed"));
  }

  session.completed = true;
  session.endedAt = new Date();
  await session.save();

  // Award XP based on duration
  const xpAmount = Math.max(10, Math.round(session.durationMinutes * 0.8));
  const xpResult = await rewardXP(
    req.user._id,
    xpAmount,
    "focus_completed",
    "focus",
    `Completed ${session.durationMinutes}m focus session`
  );

  // Check achievements
  const totalCompleted = await FocusSession.countDocuments({ user: req.user._id, completed: true });
  if (totalCompleted === 1) {
    await checkAndUnlockAchievement(
      req.user._id,
      "first_focus",
      "Laser Focus",
      "Completed your first study focus session!",
      "Clock"
    );
  } else if (totalCompleted === 10) {
    await checkAndUnlockAchievement(
      req.user._id,
      "focus_10",
      "Deep Worker",
      "Completed 10 focus sessions!",
      "Sparkles"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        session,
        xpInfo: xpResult
          ? {
              xpGained: xpAmount,
              leveledUp: xpResult.leveledUp,
              currentLevel: xpResult.user?.level,
              currentXp: xpResult.user?.xp,
            }
          : null,
      },
      "Focus session completed successfully"
    )
  );
});

// GET /api/v1/focus/today-summary
export const getTodaySummary = asyncHandler(async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const sessions = await FocusSession.find({
    user: req.user._id,
    completed: true,
    createdAt: { $gte: todayStart },
  });

  const totalMinutesToday = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      { totalMinutesToday, completedCount: sessions.length },
      "Today focus summary retrieved"
    )
  );
});

// GET /api/v1/focus/week-summary
export const getWeekSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMon);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Fetch all completed focus sessions this week
  const weekSessions = await FocusSession.find({
    user: req.user._id,
    completed: true,
    createdAt: { $gte: weekStart, $lte: weekEnd },
  });

  const dayKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const daysStatus = { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false };

  let totalMinutesWeek = 0;

  weekSessions.forEach((s) => {
    totalMinutesWeek += s.durationMinutes || 0;
    const dateObj = new Date(s.createdAt || s.startedAt);
    const jsDay = dateObj.getDay();
    const key = jsDay === 0 ? "Sun" : dayKeys[jsDay - 1];
    if (key) daysStatus[key] = true;
  });

  // Calculate streak count (all completed sessions across history)
  const allCompleted = await FocusSession.find({
    user: req.user._id,
    completed: true,
  });

  const uniqueDateStrings = new Set();
  allCompleted.forEach((s) => {
    const d = new Date(s.createdAt || s.startedAt);
    uniqueDateStrings.add(d.toISOString().split("T")[0]);
  });

  let streakDays = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  // Check today or yesterday as start of streak
  let checkStr = checkDate.toISOString().split("T")[0];
  if (!uniqueDateStrings.has(checkStr)) {
    // try yesterday
    checkDate.setDate(checkDate.getDate() - 1);
    checkStr = checkDate.toISOString().split("T")[0];
  }

  while (uniqueDateStrings.has(checkStr)) {
    streakDays++;
    checkDate.setDate(checkDate.getDate() - 1);
    checkStr = checkDate.toISOString().split("T")[0];
  }

  // Today summary
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySessions = allCompleted.filter((s) => new Date(s.createdAt || s.startedAt) >= todayStart);
  const totalMinutesToday = todaySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  const totalHoursWeek = (totalMinutesWeek / 60).toFixed(1);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        days: daysStatus,
        totalHoursWeek: parseFloat(totalHoursWeek),
        totalMinutesWeek,
        streakDays,
        totalMinutesToday,
      },
      "Week focus summary retrieved"
    )
  );
});
