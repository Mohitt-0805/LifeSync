import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "../../components/ui/Badge";
import { useGetTasksQuery } from "../tasks/tasksApi";
import { useGetGoalsQuery } from "../goals/goalsApi";
import { useGetExpenseStatsQuery } from "../expenses/expensesApi";
import { useGetNextClassQuery } from "../timetable/timetableApi";
import {
  useStartFocusSessionMutation,
  useCompleteFocusSessionMutation,
  useGetWeekFocusSummaryQuery,
} from "../focus/focusApi";
import { useGetAchievementsQuery } from "./dashboardApi";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripHorizontal,
  Flame,
  Clock,
  Trophy,
  CheckSquare,
  ArrowRight,
  BookOpen,
  Wallet,
  Play,
  Pause,
  Square,
  Sparkles,
  AlertTriangle,
  Calendar as CalendarIcon,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatCurrency";

// Widget order key for drag & drop
const WIDGET_ORDER_KEY = "lifesync_student_widget_order_v2";
const DEFAULT_ORDER = ["deadlines", "nextClass", "focusTimer", "studyStreak", "pocketMoney", "badges"];

export default function Dashboard() {
  const [widgetOrder, setWidgetOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(WIDGET_ORDER_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_ORDER;
    } catch {
      return DEFAULT_ORDER;
    }
  });

  // Queries
  const { data: tasksRes } = useGetTasksQuery();
  const { data: goalsRes } = useGetGoalsQuery();
  const { data: nextClassRes } = useGetNextClassQuery();
  const { data: weekFocusRes, refetch: refetchWeekFocus } = useGetWeekFocusSummaryQuery();
  const { data: expenseStatsRes } = useGetExpenseStatsQuery();
  const { data: achievementsRes } = useGetAchievementsQuery();

  // Focus mutations
  const [startFocusSession] = useStartFocusSessionMutation();
  const [completeFocusSession] = useCompleteFocusSessionMutation();

  // Focus Timer local state
  const [timerPreset, setTimerPreset] = useState(25); // minutes
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [focusToast, setFocusToast] = useState(null);

  // Live timer tick effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      setIsTimerRunning(false);
      handleFinishFocusSession();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeft]);

  const handleStartFocusSession = async () => {
    try {
      const duration = timerPreset;
      const res = await startFocusSession({ durationMinutes: duration }).unwrap();
      if (res?.data?._id) {
        setActiveSessionId(res.data._id);
      }
      setTimeLeft(duration * 60);
      setIsTimerRunning(true);
    } catch (err) {
      console.error("Failed to start focus session", err);
      // Fallback local running
      setTimeLeft(timerPreset * 60);
      setIsTimerRunning(true);
    }
  };

  const handleFinishFocusSession = async () => {
    if (activeSessionId) {
      try {
        const res = await completeFocusSession(activeSessionId).unwrap();
        const xp = res?.data?.xpInfo?.xpGained || 20;
        setFocusToast(`🎉 Great Focus! +${xp} XP Earned`);
      } catch (err) {
        setFocusToast("🎉 Focus Session Completed!");
      }
    } else {
      setFocusToast("🎉 Focus Session Completed!");
    }

    refetchWeekFocus();
    setActiveSessionId(null);
    setIsTimerRunning(false);
    setTimeLeft(timerPreset * 60);
    setTimeout(() => setFocusToast(null), 3000);
  };

  const handleStopFocusSession = () => {
    setIsTimerRunning(false);
    setActiveSessionId(null);
    setTimeLeft(timerPreset * 60);
  };

  const tasks = tasksRes?.data?.tasks || [];
  const goals = goalsRes?.data || [];
  const nextClassData = nextClassRes?.data || {};
  const weekFocusData = weekFocusRes?.data || {
    days: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false },
    totalHoursWeek: 0,
    streakDays: 0,
  };
  const expenseStats = expenseStatsRes?.data || { totals: { expense: 0, balance: 1500 } };
  const achievements = achievementsRes?.data || [];

  // ── Due Soon Ticker Calculation ──
  const now = new Date();
  const upcomingTasks = tasks
    .filter((t) => t.status !== "completed" && t.dueDate)
    .map((t) => ({
      title: t.title,
      dueDate: new Date(t.dueDate),
      type: t.category === "work" || t.priority === "urgent" ? "Exam/Assignment" : "Task",
    }))
    .filter((t) => t.dueDate >= now)
    .sort((a, b) => a.dueDate - b.dueDate);

  const urgentTickerItem = upcomingTasks[0] || null;

  const getRelativeCountdown = (targetDate) => {
    if (!targetDate) return "";
    const diffMs = new Date(targetDate) - new Date();
    if (diffMs <= 0) return "Due now";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 48) return `${Math.floor(hours / 24)} days left`;
    return `${hours}h ${mins}m left`;
  };

  // Drag & Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const updated = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem(WIDGET_ORDER_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  };

  // ── 1. Deadlines Widget (Hero 2x2 Span) ──
  const renderDeadlinesWidget = () => {
    const sortedDeadlines = tasks
      .filter((t) => t.status !== "completed" && t.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 2);

    return (
      <div className="bg-white dark:bg-navy-900 border-2 border-[#15151a] dark:border-white rounded-[18px] p-6 shadow-none flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between border-b-2 border-[#15151a] dark:border-white pb-3 mb-4">
            <div className="flex items-center gap-3">
              {/* Icon Badge: Red */}
              <div className="w-8 h-8 rounded-xl border-2 border-[#15151a] dark:border-white bg-[#ffe9e6] flex items-center justify-center text-[#ff4d3d] shrink-0">
                <Clock size={16} />
              </div>
              <h2 className="text-xl font-heading font-bold text-navy-900 dark:text-white">
                Deadlines & Exams
              </h2>
            </div>
            <span className="bg-[#ffe9e6] text-[#ff4d3d] font-heading font-bold text-xs px-2.5 py-0.5 rounded-full border border-[#ff4d3d]">
              {sortedDeadlines.length} Urgent
            </span>
          </div>

          {sortedDeadlines.length === 0 ? (
            <div className="text-center py-10 bg-[#f7f4ee]/50 dark:bg-navy-950/40 rounded-2xl border-2 border-dashed border-gray-300 dark:border-navy-700">
              <div className="text-2xl mb-1">🎉</div>
              <div className="font-heading font-bold text-navy-900 dark:text-white">Nothing urgent</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                You're all caught up for now.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {sortedDeadlines.map((item) => {
                const due = new Date(item.dueDate);
                const diffHours = (due - new Date()) / (1000 * 60 * 60);
                const isRed = diffHours <= 24;
                const isAmber = diffHours > 24 && diffHours <= 96;

                const borderClass = isRed
                  ? "border-[#ff4d3d] bg-[#ffe9e6]/40 text-[#ff4d3d]"
                  : isAmber
                  ? "border-[#ffa826] bg-[#fff2df]/40 text-[#b36b00]"
                  : "border-[#15151a]/20 bg-gray-50 dark:bg-navy-950/50 text-navy-900 dark:text-white";

                return (
                  <div
                    key={item._id}
                    className={`p-4 rounded-2xl border-2 ${borderClass} transition-all`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-heading font-bold text-base text-navy-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                          <CalendarIcon size={12} />
                          {due.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-heading font-bold bg-white dark:bg-navy-900 border border-black shadow-retro-sm">
                          <Clock size={12} />
                          {getRelativeCountdown(item.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Link
          to="/tasks"
          className="inline-flex items-center gap-1.5 font-heading font-bold text-sm text-[#ff4d3d] hover:underline mt-6 pt-3 border-t border-gray-100 dark:border-navy-800"
        >
          View all deadlines <ArrowRight size={16} />
        </Link>
      </div>
    );
  };

  // ── 2. Next Class Widget ──
  const renderNextClassWidget = () => {
    const nextClass = nextClassData?.nextClass;
    const classesToday = nextClassData?.classesToday || [];

    return (
      <div className="bg-white dark:bg-navy-900 border-2 border-[#15151a] dark:border-white rounded-[18px] p-5 shadow-none flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between border-b-2 border-[#15151a] dark:border-white pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              {/* Icon Badge: Blue */}
              <div className="w-8 h-8 rounded-xl border-2 border-[#15151a] dark:border-white bg-[#e8edff] flex items-center justify-center text-[#3b6cff] shrink-0">
                <BookOpen size={16} />
              </div>
              <h2 className="text-lg font-heading font-bold text-navy-900 dark:text-white">
                Next Class
              </h2>
            </div>
            {nextClassData?.dayOfWeek && (
              <span className="text-xs font-heading font-bold text-[#3b6cff] bg-[#e8edff] px-2 py-0.5 rounded-md border border-[#3b6cff]">
                {nextClassData.isToday ? "Today" : nextClassData.dayOfWeek}
              </span>
            )}
          </div>

          {!nextClass ? (
            <div className="text-center py-6 text-gray-400 font-heading text-xs italic">
              No upcoming classes scheduled. Enjoy your free time!
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="p-3 bg-[#e8edff]/50 dark:bg-navy-950 border-2 border-[#3b6cff] rounded-xl">
                <div className="font-heading font-bold text-base text-navy-900 dark:text-white truncate">
                  {nextClass.subjectName}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs font-heading font-bold text-gray-600 dark:text-gray-300">
                  <span className="flex items-center gap-1 text-[#3b6cff]">
                    <Clock size={12} />
                    {nextClass.startTime} - {nextClass.endTime}
                  </span>
                  {nextClass.room && (
                    <span className="bg-white dark:bg-navy-900 px-2 py-0.5 border border-black rounded-md">
                      Room {nextClass.room}
                    </span>
                  )}
                </div>
              </div>

              {classesToday.length > 1 && (
                <div className="text-[11px] font-heading font-bold text-gray-400 pl-1">
                  +{classesToday.length - 1} more class{classesToday.length - 1 > 1 ? "es" : ""} today
                </div>
              )}
            </div>
          )}
        </div>

        <Link
          to="/timetable"
          className="inline-flex items-center gap-1.5 font-heading font-bold text-xs text-[#3b6cff] hover:underline mt-4 pt-2 border-t border-gray-100 dark:border-navy-800"
        >
          Open timetable <ArrowRight size={14} />
        </Link>
      </div>
    );
  };

  // ── 3. Focus Timer Widget ──
  const renderFocusTimerWidget = () => {
    const totalSeconds = timerPreset * 60;
    const progressPercent = Math.round(((totalSeconds - timeLeft) / totalSeconds) * 100);
    const displayMins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const displaySecs = String(timeLeft % 60).padStart(2, "0");

    return (
      <div className="bg-white dark:bg-navy-900 border-2 border-[#15151a] dark:border-white rounded-[18px] p-5 shadow-none flex flex-col justify-between h-full relative">
        <div>
          <div className="flex items-center justify-between border-b-2 border-[#15151a] dark:border-white pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              {/* Icon Badge: Violet */}
              <div className="w-8 h-8 rounded-xl border-2 border-[#15151a] dark:border-white bg-[#f1eaff] flex items-center justify-center text-[#8b5cf6] shrink-0">
                <Clock size={16} />
              </div>
              <h2 className="text-lg font-heading font-bold text-navy-900 dark:text-white">
                Focus Timer
              </h2>
            </div>

            {/* Presets selector when idle */}
            {!isTimerRunning && (
              <div className="flex items-center gap-1 bg-[#f1eaff] p-1 rounded-lg border border-[#8b5cf6]">
                {[15, 25, 45].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setTimerPreset(m);
                      setTimeLeft(m * 60);
                    }}
                    className={`px-1.5 py-0.5 text-[10px] font-heading font-bold rounded-md transition-colors ${
                      timerPreset === m
                        ? "bg-[#8b5cf6] text-white"
                        : "text-[#8b5cf6] hover:bg-[#8b5cf6]/10"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pomodoro Timer Center */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg width="96" height="96" className="transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#f1eaff" strokeWidth="6" fill="transparent" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#8b5cf6"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={(2 * Math.PI * 40 * (100 - progressPercent)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>

              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-heading font-bold text-navy-900 dark:text-white tracking-tight">
                  {displayMins}:{displaySecs}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-3">
          {isTimerRunning ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleFinishFocusSession}
                className="flex-1 py-2.5 rounded-xl border-2 border-black bg-[#8b5cf6] text-white font-heading font-bold text-xs flex items-center justify-center gap-1 shadow-retro-sm active-press"
              >
                <Check size={14} /> Complete
              </button>
              <button
                type="button"
                onClick={handleStopFocusSession}
                className="p-2.5 rounded-xl border-2 border-black bg-gray-100 dark:bg-navy-800 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white transition-colors"
                title="Stop Timer"
              >
                <Square size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartFocusSession}
              className="w-full py-2.5 rounded-xl border-2 border-[#15151a] dark:border-white bg-[#15151a] text-white dark:bg-white dark:text-black font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-retro-sm hover:scale-[1.01] active-press spring-transition"
            >
              <Play size={14} className="fill-current" /> Start Focus Session
            </button>
          )}
        </div>

        {/* Celebratory toast */}
        <AnimatePresence>
          {focusToast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-0 bg-[#8b5cf6] text-white rounded-[18px] p-4 flex flex-col items-center justify-center text-center font-heading font-bold border-2 border-black z-20"
            >
              <Sparkles size={24} className="animate-spin mb-1" />
              <span>{focusToast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ── 4. Study Streak Widget ──
  const renderStudyStreakWidget = () => {
    const days = weekFocusData?.days || {
      Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false,
    };
    const dayKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const todayKey = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];

    return (
      <div className="bg-white dark:bg-navy-900 border-2 border-[#15151a] dark:border-white rounded-[18px] p-5 shadow-none flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between border-b-2 border-[#15151a] dark:border-white pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              {/* Icon Badge: Amber */}
              <div className="w-8 h-8 rounded-xl border-2 border-[#15151a] dark:border-white bg-[#fff2df] flex items-center justify-center text-[#ffa826] shrink-0">
                <Flame size={18} className="fill-[#ffa826]" />
              </div>
              <h2 className="text-lg font-heading font-bold text-navy-900 dark:text-white">
                Study Streak
              </h2>
            </div>
            <span className="bg-[#fff2df] text-[#b36b00] font-heading font-bold text-xs px-2.5 py-0.5 rounded-full border border-[#ffa826] flex items-center gap-1">
              <Flame size={12} className="fill-[#ffa826]" />
              {weekFocusData?.streakDays || 0} days
            </span>
          </div>

          {/* 7-day row of small squares */}
          <div className="grid grid-cols-7 gap-2 py-2 text-center">
            {dayKeys.map((day) => {
              const isDone = !!days[day];
              const isToday = day === todayKey;

              return (
                <div key={day} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-heading font-bold text-gray-400 uppercase">
                    {day[0]}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg border-2 border-[#15151a] dark:border-white flex items-center justify-center transition-all ${
                      isDone
                        ? "bg-[#ffa826] text-black font-bold shadow-retro-sm scale-105"
                        : isToday
                        ? "bg-[#fff2df] border-dashed border-[#ffa826]"
                        : "bg-gray-100 dark:bg-navy-950 text-gray-300"
                    }`}
                  >
                    {isDone && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-2 border-t border-gray-100 dark:border-navy-800 flex items-center justify-between text-xs font-heading font-bold">
          <span className="text-gray-500 dark:text-gray-400">Total focused this week:</span>
          <span className="text-[#ffa826]">{weekFocusData?.totalHoursWeek || 0} hrs</span>
        </div>
      </div>
    );
  };

  // ── 5. Pocket Money Left Widget ──
  const renderPocketMoneyWidget = () => {
    const spent = Math.abs(expenseStats?.totals?.expense || 0);
    const totalBudget = 15000; // Monthly budget benchmark (INR)
    const remaining = Math.max(0, totalBudget - spent);

    return (
      <div className="bg-white dark:bg-navy-900 border-2 border-[#15151a] dark:border-white rounded-[18px] p-5 shadow-none flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between border-b-2 border-[#15151a] dark:border-white pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              {/* Icon Badge: Green */}
              <div className="w-8 h-8 rounded-xl border-2 border-[#15151a] dark:border-white bg-[#e2f7ee] flex items-center justify-center text-[#1fb37a] shrink-0">
                <Wallet size={16} />
              </div>
              <h2 className="text-lg font-heading font-bold text-navy-900 dark:text-[#f7f4ee]">
                Pocket Money Left
              </h2>
            </div>
            <span className="text-xs font-heading font-bold text-[#1fb37a] bg-[#e2f7ee] px-2 py-0.5 rounded-md border border-[#1fb37a]">
              Monthly
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-heading font-bold text-navy-900 dark:text-white tracking-tight">
              {formatCurrency(remaining)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-heading font-bold">
              remaining of {formatCurrency(totalBudget)} budget this month ({formatCurrency(spent)} spent)
            </div>
          </div>
        </div>

        <Link
          to="/expenses"
          className="inline-flex items-center gap-1.5 font-heading font-bold text-xs text-[#1fb37a] hover:underline mt-4 pt-2 border-t border-gray-100 dark:border-navy-800"
        >
          Log expense <ArrowRight size={14} />
        </Link>
      </div>
    );
  };

  // ── 6. Badges Widget ──
  const renderBadgesWidget = () => (
    <div className="bg-white dark:bg-navy-900 border-2 border-[#15151a] dark:border-white rounded-[18px] p-5 shadow-none flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between border-b-2 border-[#15151a] dark:border-white pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            {/* Icon Badge: Violet */}
            <div className="w-8 h-8 rounded-xl border-2 border-[#15151a] dark:border-white bg-[#f1eaff] flex items-center justify-center text-[#8b5cf6] shrink-0">
              <Trophy size={16} />
            </div>
            <h2 className="text-lg font-heading font-bold text-navy-900 dark:text-white">
              Badges
            </h2>
          </div>
          <span className="bg-[#f1eaff] text-[#8b5cf6] font-heading font-bold text-xs px-2.5 py-0.5 rounded-full border border-[#8b5cf6]">
            {achievements.length} Unlocked
          </span>
        </div>

        {achievements.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-xs font-heading italic">
            None yet — finish a study streak to unlock a new badge!
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2.5">
            {achievements.slice(0, 4).map((badge) => (
              <div
                key={badge._id}
                title={`${badge.title}: ${badge.description}`}
                className="w-10 h-10 rounded-xl border-2 border-black bg-[#f1eaff] flex items-center justify-center text-[#8b5cf6] shadow-retro-sm hover:scale-105 transition-transform"
              >
                <Trophy size={18} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-[11px] font-heading font-bold text-gray-400 mt-4 pt-2 border-t border-gray-100 dark:border-navy-800">
        Finish study focus sessions to unlock new badges
      </div>
    </div>
  );

  const getWidgetComponent = (id) => {
    switch (id) {
      case "deadlines":
        return renderDeadlinesWidget();
      case "nextClass":
        return renderNextClassWidget();
      case "focusTimer":
        return renderFocusTimerWidget();
      case "studyStreak":
        return renderStudyStreakWidget();
      case "pocketMoney":
        return renderPocketMoneyWidget();
      case "badges":
        return renderBadgesWidget();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── NEW ELEMENT: Persistent "DUE SOON" Ticker ── */}
      {urgentTickerItem && (
        <div className="w-full bg-[#15151a] text-white rounded-xl p-3 px-4 flex items-center justify-between gap-3 shadow-retro border-2 border-black">
          <div className="flex items-center gap-3 min-w-0">
            <span className="bg-[#ff4d3d] text-white text-[10px] font-heading font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
              DUE SOON
            </span>
            <span className="font-heading font-bold text-sm truncate">
              {urgentTickerItem.type}: <span className="text-gray-300 font-normal">{urgentTickerItem.title}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-heading font-bold text-[#ff4d3d] bg-[#ffe9e6] px-2.5 py-0.5 rounded-md border border-[#ff4d3d]">
              {getRelativeCountdown(urgentTickerItem.dueDate)}
            </span>
            <Link to="/tasks" className="text-xs text-gray-400 hover:text-white underline">
              View
            </Link>
          </div>
        </div>
      )}

      {/* Dashboard Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-heading font-bold text-navy-900 dark:text-white">
          Student Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-body">
          Track deadlines, classes, study streaks, and pomodoro focus sessions
        </p>
      </div>

      {/* Sortable Grid Context */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {widgetOrder.map((id) => {
              // Custom column spans per widget type
              const colSpanClass =
                id === "deadlines"
                  ? "lg:col-span-4"
                  : "lg:col-span-2";

              return (
                <SortableItem key={id} id={id} className={colSpanClass}>
                  {getWidgetComponent(id)}
                </SortableItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// Sortable item wrapper preserving dnd-kit functionality
function SortableItem({ id, className = "", children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 250ms cubic-bezier(0.2, 0, 0, 1)",
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`h-full relative group ${className}`}>
      {/* Drag handle header overlay */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-4 right-4 p-1.5 border border-black/10 dark:border-white/10 rounded-lg hover:bg-[#f7f4ee] dark:hover:bg-navy-800 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white dark:bg-navy-900"
        title="Drag to reposition widget"
      >
        <GripHorizontal size={14} />
      </div>
      {children}
    </div>
  );
}
