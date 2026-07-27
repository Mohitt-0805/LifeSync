import { Event } from "../models/Event.js";
import { Task } from "../models/Task.js";
import { Goal } from "../models/Goal.js";
import { Expense } from "../models/Expense.js";

/**
 * Service function to aggregate and normalize calendar items from multiple models
 * into a single unified array.
 */
export async function getUnifiedCalendarItems({
  userId,
  month,
  year,
  startDate,
  endDate,
  include,
}) {
  let rangeStart, rangeEnd;

  if (startDate && endDate) {
    rangeStart = new Date(startDate);
    rangeEnd = new Date(endDate);
  } else if (month !== undefined && year !== undefined) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const monthIdx = m > 0 && m <= 12 ? m - 1 : m;
    rangeStart = new Date(Date.UTC(y, monthIdx, 1, 0, 0, 0, 0));
    rangeEnd = new Date(Date.UTC(y, monthIdx + 1, 0, 23, 59, 59, 999));
  } else {
    const now = new Date();
    rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    rangeEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  }

  // Parse types to include (default: tasks, events, goals, memberships)
  const requestedTypes = include
    ? include.split(",").map((s) => s.trim().toLowerCase())
    : ["tasks", "events", "goals", "memberships"];

  const queries = [];

  // 1. Events
  if (requestedTypes.includes("events")) {
    queries.push(
      Event.find({
        user: userId,
        $or: [
          { startDate: { $gte: rangeStart, $lte: rangeEnd } },
          { endDate: { $gte: rangeStart, $lte: rangeEnd } },
        ],
      })
    );
  } else {
    queries.push(Promise.resolve([]));
  }

  // 2. Tasks
  if (requestedTypes.includes("tasks")) {
    queries.push(
      Task.find({
        user: userId,
        dueDate: { $gte: rangeStart, $lte: rangeEnd },
      })
    );
  } else {
    queries.push(Promise.resolve([]));
  }

  // 3. Goals
  if (requestedTypes.includes("goals")) {
    queries.push(
      Goal.find({
        user: userId,
        targetDate: { $gte: rangeStart, $lte: rangeEnd },
      })
    );
  } else {
    queries.push(Promise.resolve([]));
  }

  // 4. Memberships / Expenses
  if (requestedTypes.includes("memberships")) {
    queries.push(
      Expense.find({
        user: userId,
        date: { $gte: rangeStart, $lte: rangeEnd },
      })
    );
  } else {
    queries.push(Promise.resolve([]));
  }

  const [rawEvents, rawTasks, rawGoals, rawExpenses] = await Promise.all(queries);

  const items = [];

  // Normalize Events
  for (const evt of rawEvents) {
    const doc = typeof evt.toObject === "function" ? evt.toObject() : evt;
    items.push({
      id: `event_${doc._id}`,
      sourceId: doc._id.toString(),
      sourceModel: "Event",
      type: "event",
      title: doc.title,
      description: doc.description || "",
      date: doc.startDate,
      startDate: doc.startDate,
      endDate: doc.endDate,
      category: doc.category || "general",
      isAllDay: doc.isAllDay || false,
      color: "#3B82F6",
      raw: doc,
    });
  }

  // Normalize Tasks
  for (const task of rawTasks) {
    const doc = typeof task.toObject === "function" ? task.toObject() : task;
    items.push({
      id: `task_${doc._id}`,
      sourceId: doc._id.toString(),
      sourceModel: "Task",
      type: "task",
      title: doc.title,
      description: doc.description || "",
      date: doc.dueDate,
      status: doc.status,
      priority: doc.priority,
      category: doc.category || "personal",
      tags: doc.tags || [],
      color: "#FF6B6B",
      raw: doc,
    });
  }

  // Normalize Goals
  for (const goal of rawGoals) {
    const doc = typeof goal.toObject === "function" ? goal.toObject() : goal;
    items.push({
      id: `goal_${doc._id}`,
      sourceId: doc._id.toString(),
      sourceModel: "Goal",
      type: "goal",
      title: doc.title,
      description: doc.description || "",
      date: doc.targetDate,
      status: doc.status,
      progress: doc.progress || 0,
      category: doc.category || "career",
      color: "#8B5CF6",
      raw: doc,
    });
  }

  // Normalize Memberships / Expenses
  for (const exp of rawExpenses) {
    const doc = typeof exp.toObject === "function" ? exp.toObject() : exp;
    items.push({
      id: `membership_${doc._id}`,
      sourceId: doc._id.toString(),
      sourceModel: "Expense",
      type: "membership",
      title: `${doc.type === "income" ? "+" : "-"}₹${doc.amount} ${doc.category}`,
      description: doc.description || `${doc.type} in ${doc.category}`,
      date: doc.date,
      amount: doc.amount,
      expenseType: doc.type,
      category: doc.category,
      color: "#F59E0B",
      raw: doc,
    });
  }

  // Sort items chronologically by date
  items.sort((a, b) => new Date(a.date) - new Date(b.date));

  return items;
}
