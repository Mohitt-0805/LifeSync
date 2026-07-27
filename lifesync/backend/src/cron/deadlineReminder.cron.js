import cron from "node-cron";
import { Task } from "../models/Task.js";
import { Goal } from "../models/Goal.js";
import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { sendWhatsAppMessage, hasBeenSentToday } from "../services/notification.service.js";

/**
 * Core function executing deadline reminder queries & dispatches.
 * Exported so it can be called by scheduled cron and on-demand dev debug routes.
 */
export async function runDeadlineReminders() {
  console.log("⏰ [DEADLINE CRON] Running deadline reminder check...");

  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const dateFormatted = tomorrowStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Query Tasks, Goals, and Events matching tomorrow's deadline in parallel
  const [tasks, goals, events] = await Promise.all([
    Task.find({
      dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
      status: { $ne: "completed" },
    }),
    Goal.find({
      targetDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
      status: { $ne: "completed" },
      progress: { $lt: 100 },
    }),
    Event.find({
      startDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
    }),
  ]);

  console.log(
    `⏰ [DEADLINE CRON] Found matching deadlines for tomorrow (${dateFormatted}): ` +
      `${tasks.length} tasks, ${goals.length} goals, ${events.length} events.`
  );

  let sentCount = 0;
  let skippedCount = 0;
  const details = [];

  // Helper to fetch user doc safely
  const getUser = async (userId) => {
    if (!userId) return null;
    if (typeof userId === "object" && userId.email) return userId;
    return await User.findById(userId);
  };

  // 1. Process Tasks
  for (const task of tasks) {
    const user = await getUser(task.user);
    if (!user) {
      skippedCount++;
      continue;
    }

    if (!user.whatsappOptIn || !user.whatsappVerified) {
      skippedCount++;
      details.push({ id: task._id, type: "task_due", title: task.title, status: "skipped_opt_in_or_verified" });
      continue;
    }

    if (user.whatsappPreferences?.tasks === false) {
      skippedCount++;
      details.push({ id: task._id, type: "task_due", title: task.title, status: "skipped_pref_disabled" });
      continue;
    }

    const alreadySent = await hasBeenSentToday({ user: user._id, relatedEntityId: task._id, type: "task_due" });
    if (alreadySent) {
      skippedCount++;
      details.push({ id: task._id, type: "task_due", title: task.title, status: "skipped_already_sent_today" });
      continue;
    }

    const message = `Hi ${user.name}, your task '${task.title}' is due tomorrow (${dateFormatted}). Stay on track!`;
    const res = await sendWhatsAppMessage({
      user,
      recipient: user.phoneNumber,
      message,
      type: "task_due",
      relatedEntityId: task._id,
      relatedEntityType: "Task",
    });

    if (res.success) {
      sentCount++;
      details.push({ id: task._id, type: "task_due", title: task.title, status: "sent" });
    } else {
      skippedCount++;
      details.push({ id: task._id, type: "task_due", title: task.title, status: `failed_${res.reason || res.status}` });
    }
  }

  // 2. Process Goals
  for (const goal of goals) {
    const user = await getUser(goal.user);
    if (!user) {
      skippedCount++;
      continue;
    }

    if (!user.whatsappOptIn || !user.whatsappVerified) {
      skippedCount++;
      details.push({ id: goal._id, type: "goal_deadline", title: goal.title, status: "skipped_opt_in_or_verified" });
      continue;
    }

    if (user.whatsappPreferences?.goals === false) {
      skippedCount++;
      details.push({ id: goal._id, type: "goal_deadline", title: goal.title, status: "skipped_pref_disabled" });
      continue;
    }

    const alreadySent = await hasBeenSentToday({ user: user._id, relatedEntityId: goal._id, type: "goal_deadline" });
    if (alreadySent) {
      skippedCount++;
      details.push({ id: goal._id, type: "goal_deadline", title: goal.title, status: "skipped_already_sent_today" });
      continue;
    }

    const progress = goal.progress || 0;
    const message = `Hi ${user.name}, your goal '${goal.title}' deadline is tomorrow (${dateFormatted}). You're at ${progress}% — final push!`;
    const res = await sendWhatsAppMessage({
      user,
      recipient: user.phoneNumber,
      message,
      type: "goal_deadline",
      relatedEntityId: goal._id,
      relatedEntityType: "Goal",
    });

    if (res.success) {
      sentCount++;
      details.push({ id: goal._id, type: "goal_deadline", title: goal.title, status: "sent" });
    } else {
      skippedCount++;
      details.push({ id: goal._id, type: "goal_deadline", title: goal.title, status: `failed_${res.reason || res.status}` });
    }
  }

  // 3. Process Events
  for (const event of events) {
    const user = await getUser(event.user);
    if (!user) {
      skippedCount++;
      continue;
    }

    if (!user.whatsappOptIn || !user.whatsappVerified) {
      skippedCount++;
      details.push({ id: event._id, type: "event_reminder", title: event.title, status: "skipped_opt_in_or_verified" });
      continue;
    }

    if (user.whatsappPreferences?.events === false) {
      skippedCount++;
      details.push({ id: event._id, type: "event_reminder", title: event.title, status: "skipped_pref_disabled" });
      continue;
    }

    const alreadySent = await hasBeenSentToday({ user: user._id, relatedEntityId: event._id, type: "event_reminder" });
    if (alreadySent) {
      skippedCount++;
      details.push({ id: event._id, type: "event_reminder", title: event.title, status: "skipped_already_sent_today" });
      continue;
    }

    const message = `Hi ${user.name}, reminder: '${event.title}' is tomorrow (${dateFormatted}).`;
    const res = await sendWhatsAppMessage({
      user,
      recipient: user.phoneNumber,
      message,
      type: "event_reminder",
      relatedEntityId: event._id,
      relatedEntityType: "Event",
    });

    if (res.success) {
      sentCount++;
      details.push({ id: event._id, type: "event_reminder", title: event.title, status: "sent" });
    } else {
      skippedCount++;
      details.push({ id: event._id, type: "event_reminder", title: event.title, status: `failed_${res.reason || res.status}` });
    }
  }

  const resultSummary = {
    date: dateFormatted,
    matched: { tasks: tasks.length, goals: goals.length, events: events.length },
    sentCount,
    skippedCount,
    details,
  };

  console.log(`⏰ [DEADLINE CRON COMPLETE] Sent: ${sentCount}, Skipped/Failed: ${skippedCount}`);
  return resultSummary;
}

/**
 * Initializes scheduled cron job.
 */
export function initDeadlineReminderCron() {
  const schedule = process.env.DEADLINE_REMINDER_CRON || "0 9 * * *";
  console.log(`⏰ Deadline Reminder Cron scheduled: "${schedule}"`);

  cron.schedule(schedule, async () => {
    try {
      await runDeadlineReminders();
    } catch (err) {
      console.error("❌ Scheduled deadline reminder failed:", err);
    }
  });
}
