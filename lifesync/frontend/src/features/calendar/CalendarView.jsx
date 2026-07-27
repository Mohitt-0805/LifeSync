import React, { useState, useEffect } from "react";
import {
  useGetUnifiedCalendarQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} from "./calendarApi";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Dropdown } from "../../components/ui/Dropdown";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  CheckSquare,
  Target,
  Wallet,
  Clock,
  Check,
  ExternalLink,
  Filter,
  Tag,
  X,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

const STORAGE_KEY_FILTERS = "lifesync_calendar_filters";

const DEFAULT_FILTERS = {
  tasks: true,
  events: true,
  goals: true,
  memberships: true,
};

export default function CalendarView() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Filter chips state with localStorage persistence
  const [activeFilters, setActiveFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILTERS);
      return saved ? JSON.parse(saved) : DEFAULT_FILTERS;
    } catch {
      return DEFAULT_FILTERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(activeFilters));
    } catch (err) {
      console.error("Failed to save calendar filters to localStorage", err);
    }
  }, [activeFilters]);

  // Modal & Selection states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null); // Day detail popover/modal

  // Event Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [formError, setFormError] = useState("");

  // Construct query params
  const activeIncludeString = Object.entries(activeFilters)
    .filter(([_, enabled]) => enabled)
    .map(([type]) => type)
    .join(",");

  const { data: calendarRes, isLoading } = useGetUnifiedCalendarQuery({
    month: currentMonth + 1,
    year: currentYear,
    include: activeIncludeString || "none",
  });

  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent] = useUpdateEventMutation();
  const [deleteEvent] = useDeleteEventMutation();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const toggleFilter = (typeKey) => {
    setActiveFilters((prev) => ({
      ...prev,
      [typeKey]: !prev[typeKey],
    }));
  };

  const handleBlankDayClick = (day) => {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(formattedDate);
    setActiveEvent(null);
    setTitle("");
    setDescription("");
    setCategory("general");
    setStartTime("09:00");
    setEndTime("10:00");
    setIsAllDay(false);
    setIsEventModalOpen(true);
  };

  const handleItemClick = (e, item) => {
    e.stopPropagation();
    if (item.type === "event") {
      setActiveEvent(item.raw);
      const startD = new Date(item.startDate || item.date);
      const endD = new Date(item.endDate || item.date);
      setSelectedDate(new Date(item.date).toISOString().split("T")[0]);
      setTitle(item.title);
      setDescription(item.description || "");
      setCategory(item.category || "general");
      setStartTime(
        `${String(startD.getHours()).padStart(2, "0")}:${String(startD.getMinutes()).padStart(2, "0")}`
      );
      setEndTime(
        `${String(endD.getHours()).padStart(2, "0")}:${String(endD.getMinutes()).padStart(2, "0")}`
      );
      setIsAllDay(item.isAllDay || false);
      setIsEventModalOpen(true);
    } else {
      // Task, Goal, or Membership detail modal
      setSelectedItemDetail(item);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Event title is required");
      return;
    }

    const startDateTimeStr = `${selectedDate}T${startTime}:00`;
    const endDateTimeStr = `${selectedDate}T${endTime}:00`;

    if (new Date(startDateTimeStr) > new Date(endDateTimeStr)) {
      setFormError("Start time must be prior to end time");
      return;
    }

    try {
      if (activeEvent) {
        await updateEvent({
          id: activeEvent._id,
          title,
          description,
          category,
          startDate: new Date(startDateTimeStr),
          endDate: new Date(endDateTimeStr),
          isAllDay,
        }).unwrap();
      } else {
        await createEvent({
          title,
          description,
          category,
          startDate: new Date(startDateTimeStr),
          endDate: new Date(endDateTimeStr),
          isAllDay,
        }).unwrap();
      }
      setIsEventModalOpen(false);
    } catch (err) {
      setFormError(err?.data?.message || "Failed to schedule event");
    }
  };

  const handleDeleteEvent = async () => {
    if (!activeEvent) return;
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEvent(activeEvent._id).unwrap();
        setIsEventModalOpen(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const calendarItems = calendarRes?.data || [];

  // Group items by day of month
  const itemsByDay = {};
  calendarItems.forEach((item) => {
    const itemDate = new Date(item.date);
    // Ensure item falls in the currently displayed month & year
    if (
      itemDate.getUTCMonth() === currentMonth ||
      itemDate.getMonth() === currentMonth
    ) {
      const day = itemDate.getUTCDate() || itemDate.getDate();
      if (!itemsByDay[day]) itemsByDay[day] = [];
      itemsByDay[day].push(item);
    }
  });

  const getItemBadgeStyle = (item) => {
    switch (item.type) {
      case "task":
        return {
          bg: item.status === "completed" ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 line-through opacity-75 border-rose-300" : "bg-rose-500 text-white border-rose-600",
          icon: CheckSquare,
          label: "Task",
        };
      case "goal":
        return {
          bg: "bg-purple-600 text-white border-purple-700",
          icon: Target,
          label: "Goal",
        };
      case "membership":
        return {
          bg: "bg-amber-500 text-black font-bold border-amber-600",
          icon: Wallet,
          label: "Expense",
        };
      case "event":
      default:
        return {
          bg: "bg-blue-600 text-white border-blue-700",
          icon: CalendarIcon,
          label: "Event",
        };
    }
  };

  const calendarCells = [];
  // Render empty cells for day offsets
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(
      <div
        key={`empty-${i}`}
        className="bg-cream-dark/20 dark:bg-navy-950/20 border border-gray-200 dark:border-navy-800/80 min-h-[110px] p-1"
      />
    );
  }

  // Render day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayItems = itemsByDay[day] || [];
    const isToday =
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();

    const maxVisible = 2;
    const visibleItems = dayItems.slice(0, maxVisible);
    const hiddenCount = dayItems.length - maxVisible;

    calendarCells.push(
      <div
        key={`day-${day}`}
        onClick={() => handleBlankDayClick(day)}
        className={`min-h-[115px] border border-gray-200 dark:border-navy-800 bg-white dark:bg-navy-900 p-1.5 flex flex-col justify-between hover:bg-cream-light dark:hover:bg-navy-800/50 cursor-pointer spring-transition relative ${
          isToday ? "border-2 border-brand ring-1 ring-brand bg-orange-50/10" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-heading font-bold px-2 py-0.5 rounded-full ${
              isToday ? "bg-brand text-white shadow-retro-sm" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {day}
          </span>
          {dayItems.length > 0 && (
            <span className="text-[10px] font-heading font-bold text-gray-400">
              {dayItems.length} item{dayItems.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
          {visibleItems.map((item) => {
            const badge = getItemBadgeStyle(item);
            const ItemIcon = badge.icon;

            return (
              <div
                key={item.id}
                onClick={(e) => handleItemClick(e, item)}
                className={`text-[10px] font-heading font-bold py-0.5 px-1.5 rounded-lg border flex items-center gap-1 truncate ${badge.bg} hover:opacity-95 hover:scale-[1.01] spring-transition shadow-retro-sm`}
                title={`${badge.label}: ${item.title}`}
              >
                <ItemIcon size={10} className="shrink-0" />
                <span className="truncate">{item.title}</span>
              </div>
            );
          })}

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedDay({ day, items: dayItems });
              }}
              className="text-[10px] font-heading font-bold py-0.5 px-1.5 rounded-lg bg-gray-100 dark:bg-navy-800 border border-black/30 dark:border-white/30 text-gray-700 dark:text-gray-300 hover:bg-gray-200 text-left transition-colors flex items-center justify-between"
            >
              <span>+{hiddenCount} more</span>
              <ChevronRight size={10} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-heading font-bold text-candy-calendar flex items-center gap-2">
            <CalendarIcon size={32} className="text-candy-calendar" />
            Unified Calendar
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            View Tasks, Events, Goals, and Expense deadlines in one combined schedule
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white dark:bg-navy-900 border-2 border-black dark:border-white p-2 rounded-2xl shadow-retro-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1 border border-black dark:border-white rounded-lg hover:bg-cream-dark dark:hover:bg-navy-800 active-press"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-heading font-bold text-sm min-w-[120px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 border border-black dark:border-white rounded-lg hover:bg-cream-dark dark:hover:bg-navy-800 active-press"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <Button onClick={() => handleBlankDayClick(today.getDate())} className="flex items-center gap-2">
            <Plus size={18} />
            Add Event
          </Button>
        </div>
      </div>

      {/* Requirement 5: Filter Control Chips (Tasks, Events, Goals, Memberships) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-navy-900 p-4 border-2 border-black dark:border-white rounded-3xl shadow-retro-sm">
        <div className="flex items-center gap-2 text-xs font-heading font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          <Filter size={14} /> Filter Views:
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "tasks", label: "Tasks", icon: CheckSquare, color: "bg-rose-500 text-white border-rose-600" },
            { key: "events", label: "Events", icon: CalendarIcon, color: "bg-blue-600 text-white border-blue-700" },
            { key: "goals", label: "Goals", icon: Target, color: "bg-purple-600 text-white border-purple-700" },
            { key: "memberships", label: "Expenses", icon: Wallet, color: "bg-amber-500 text-black border-amber-600" },
          ].map(({ key, label, icon: Icon, color }) => {
            const isActive = activeFilters[key];

            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-heading font-bold transition-all active-press ${
                  isActive
                    ? `${color} shadow-retro-sm`
                    : "bg-gray-100 dark:bg-navy-950 text-gray-400 border-gray-300 dark:border-navy-700 opacity-60"
                }`}
              >
                <Icon size={12} />
                <span>{label}</span>
                {isActive && <Check size={12} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid calendar */}
      <Card hoverable={false} className="p-4 bg-white dark:bg-navy-900 border-2 border-black overflow-hidden shadow-retro">
        {/* Weekday labels */}
        <div className="grid grid-cols-7 text-center font-heading font-bold text-xs text-gray-500 border-b-2 border-black dark:border-white pb-3 mb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days grid */}
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white" />
          </div>
        ) : (
          <div className="grid grid-cols-7 border-t border-l border-gray-200 dark:border-navy-800 rounded-lg overflow-hidden">
            {calendarCells}
          </div>
        )}
      </Card>

      {/* Requirement 6: Day Detail Popover / Expanded Day Modal */}
      <Modal
        isOpen={!!expandedDay}
        onClose={() => setExpandedDay(null)}
        title={expandedDay ? `Schedule for ${monthNames[currentMonth]} ${expandedDay.day}, ${currentYear}` : ""}
      >
        {expandedDay && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {expandedDay.items.map((item) => {
              const badge = getItemBadgeStyle(item);
              const ItemIcon = badge.icon;

              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    setExpandedDay(null);
                    handleItemClick(e, item);
                  }}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.01] ${badge.bg} shadow-retro-sm flex items-center justify-between gap-3`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ItemIcon size={18} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="font-heading font-bold text-sm truncate">
                        {item.title}
                      </div>
                      {item.description && (
                        <div className="text-xs opacity-90 truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="uppercase text-[10px] shrink-0">
                    {item.type}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Requirement 4: Detail Modal for Tasks / Goals / Memberships */}
      <Modal
        isOpen={!!selectedItemDetail}
        onClose={() => setSelectedItemDetail(null)}
        title={selectedItemDetail ? `${selectedItemDetail.type.toUpperCase()} DETAILS` : ""}
      >
        {selectedItemDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-heading font-bold border-2 ${getItemBadgeStyle(selectedItemDetail).bg}`}>
                {selectedItemDetail.type.toUpperCase()}
              </span>
              {selectedItemDetail.category && (
                <Badge variant="secondary" className="capitalize">
                  {selectedItemDetail.category}
                </Badge>
              )}
            </div>

            <h2 className="text-2xl font-heading font-bold text-navy-900 dark:text-white">
              {selectedItemDetail.title}
            </h2>

            {selectedItemDetail.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-cream/50 dark:bg-navy-950 p-3 rounded-xl border border-black/10">
                {selectedItemDetail.description}
              </p>
            )}

            <div className="space-y-2 text-xs font-heading font-bold text-gray-500">
              <div className="flex items-center gap-2">
                <CalendarIcon size={14} />
                <span>Date: {new Date(selectedItemDetail.date).toLocaleDateString()}</span>
              </div>

              {selectedItemDetail.status && (
                <div className="flex items-center gap-2">
                  <Sparkles size={14} />
                  <span>Status: <span className="text-brand capitalize">{selectedItemDetail.status}</span></span>
                </div>
              )}

              {selectedItemDetail.progress !== undefined && (
                <div className="flex items-center gap-2">
                  <Target size={14} />
                  <span>Progress: <span className="text-purple-600">{selectedItemDetail.progress}%</span></span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-black/10 flex justify-between items-center">
              <Link
                to={
                  selectedItemDetail.type === "task"
                    ? "/tasks"
                    : selectedItemDetail.type === "goal"
                    ? "/goals"
                    : "/expenses"
                }
                className="inline-flex items-center gap-1 text-xs font-heading font-bold text-brand hover:underline"
              >
                Go to {selectedItemDetail.type}s module <ExternalLink size={12} />
              </Link>
              <Button variant="outline" onClick={() => setSelectedItemDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Event Details / Schedule Modal */}
      <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title={activeEvent ? "Modify Event" : "Schedule Event"}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-100 border-2 border-black text-red-700 rounded-xl font-heading text-sm font-bold text-center">
              {formError}
            </div>
          )}

          <Input
            label="Event Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Project presentation, Gym session"
            required
          />

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Include notes or locations..."
            textarea
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              label="Visual Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { label: "General (Indigo)", value: "general" },
                { label: "Work & Tasks (Coral)", value: "work" },
                { label: "Goals & Targets (Violet)", value: "goals" },
                { label: "Habits (Emerald)", value: "habits" },
                { label: "Expenses (Amber)", value: "expenses" },
              ]}
            />
            <Input
              label="Selected Date"
              type="date"
              value={selectedDate || ""}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 justify-between items-center pt-4">
            {activeEvent ? (
              <Button type="button" variant="danger" onClick={handleDeleteEvent} className="flex items-center gap-1">
                <Trash2 size={16} />
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEventModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isCreating}>
                {activeEvent ? "Update Event" : "Schedule"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
