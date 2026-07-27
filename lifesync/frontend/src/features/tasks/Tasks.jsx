import React, { useState } from "react";
import {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "./tasksApi";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Dropdown } from "../../components/ui/Dropdown";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  Tag,
  Sparkles,
} from "lucide-react";

export default function Tasks() {
  const [activeTab, setActiveTab] = useState("active"); // active, completed
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("personal");
  const [dueDate, setDueDate] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [formError, setFormError] = useState("");

  // XP notification toast state
  const [xpToast, setXpToast] = useState(null);

  // Queries & Mutations
  const { data: tasksRes, isLoading } = useGetTasksQuery({
    status: activeTab === "completed" ? "completed" : undefined,
    category: categoryFilter || undefined,
    priority: priorityFilter || undefined,
    search: searchQuery || undefined,
  });

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Task title is required");
      return;
    }

    try {
      const tags = tagsInput
        ? tagsInput.split(",").map((t) => t.trim()).filter((t) => t)
        : [];

      const payloadDueDate =
        dueDate && dueDate.trim()
          ? new Date(`${dueDate.trim()}T00:00:00.000Z`).toISOString()
          : undefined;

      await createTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        dueDate: payloadDueDate,
        tags,
      }).unwrap();

      // Reset
      setTitle("");
      setDescription("");
      setPriority("medium");
      setCategory("personal");
      setDueDate("");
      setTagsInput("");
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err?.data?.message || "Failed to create task");
    }
  };

  const handleToggleComplete = async (task) => {
    const isCurrentlyCompleted = task.status === "completed";
    const nextStatus = isCurrentlyCompleted ? "todo" : "completed";

    try {
      const res = await updateTask({
        id: task._id,
        status: nextStatus,
      }).unwrap();

      // If completing, show a bouncy XP indicator toast
      if (nextStatus === "completed" && res.data.xpInfo) {
        setXpToast("+10 XP Earned!");
        setTimeout(() => setXpToast(null), 1800);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(id).unwrap();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredTasks = tasksRes?.data?.tasks?.filter((task) => {
    // If viewing Active tab, exclude completed tasks
    if (activeTab === "active" && task.status === "completed") return false;
    return true;
  }) || [];

  const getPriorityBadge = (prio) => {
    const mapping = {
      low: { label: "Low Priority", bg: "bg-gray-100 dark:bg-navy-800 text-gray-700 dark:text-gray-300 border-gray-400" },
      medium: { label: "Medium", bg: "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-400" },
      high: { label: "High", bg: "bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-400" },
      urgent: { label: "Urgent 🔥", bg: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-500 font-extrabold" },
    };
    const item = mapping[prio] || mapping.medium;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-heading font-bold border-2 rounded-full ${item.bg}`}>
        {item.label}
      </span>
    );
  };

  const getDueDateStatus = (dueDateString, isCompleted) => {
    if (!dueDateString) return null;
    const date = new Date(dueDateString);
    if (isNaN(date.getTime())) return null;

    const formattedDate = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });

    if (isCompleted) {
      return { text: formattedDate, isOverdue: false, isToday: false };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueYear = date.getUTCFullYear();
    const dueMonth = date.getUTCMonth();
    const dueDateDay = date.getUTCDate();
    const dueMidnight = new Date(dueYear, dueMonth, dueDateDay);

    const diffTime = dueMidnight.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${formattedDate} (Overdue)`, isOverdue: true, isToday: false };
    } else if (diffDays === 0) {
      return { text: `${formattedDate} (Due Today)`, isOverdue: false, isToday: true };
    }

    return { text: formattedDate, isOverdue: false, isToday: false };
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-heading font-bold text-candy-tasks">Task Board</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Check off items to level up and earn experience
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={18} />
          Create Task
        </Button>
      </div>

      {/* Tabs & Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white dark:bg-navy-900 p-4 border-2 border-black dark:border-white rounded-3xl shadow-retro-sm">
        {/* Active/Completed Tabs */}
        <div className="flex border-2 border-black rounded-2xl overflow-hidden max-w-xs">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2 px-4 font-heading font-bold text-sm ${
              activeTab === "active"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-white text-black dark:bg-navy-900 dark:text-white"
            } transition-colors`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 py-2 px-4 font-heading font-bold text-sm ${
              activeTab === "completed"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-white text-black dark:bg-navy-900 dark:text-white"
            } transition-colors`}
          >
            Completed
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Dropdown
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { label: "All Categories", value: "" },
              { label: "Work", value: "work" },
              { label: "Personal", value: "personal" },
              { label: "Health", value: "health" },
              { label: "Finance", value: "finance" },
              { label: "Other", value: "other" },
            ]}
          />
          <Dropdown
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={[
              { label: "All Priorities", value: "" },
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
              { label: "Urgent", value: "urgent" },
            ]}
          />
        </div>

        {/* Search */}
        <div className="relative w-full">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full"
          />
        </div>
      </div>

      {/* Task List container */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton />
          <Skeleton />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card hoverable={false} className="text-center py-12 border-dashed border-4">
          <div className="mx-auto w-16 h-16 bg-cream border-2 border-black rounded-2xl flex items-center justify-center mb-4">
            <Clock size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-1">No tasks found</h2>
          <p className="text-gray-500 max-w-sm mx-auto text-sm">
            Ready to log something? Create a new task above and start earning XP!
          </p>
        </Card>
      ) : (
        <div className="space-y-3.5">
          <AnimatePresence initial={false}>
            {filteredTasks.map((task) => {
              const dueStatus = getDueDateStatus(task.dueDate, task.status === "completed");

              return (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Card
                    variant="tasks"
                    hoverable={true}
                    className={`p-4 sm:p-5 bg-white dark:bg-navy-900 border-2 border-black dark:border-white shadow-retro-sm transition-all ${
                      task.status === "completed"
                        ? "bg-gray-50/80 dark:bg-navy-950/60 opacity-80"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left section: Checkbox + Content */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Checkbox button */}
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(task)}
                          aria-label={task.status === "completed" ? "Mark incomplete" : "Mark complete"}
                          className={`w-7 h-7 sm:w-8 sm:h-8 mt-0.5 rounded-xl border-2 border-black dark:border-white flex items-center justify-center spring-transition shrink-0 cursor-pointer ${
                            task.status === "completed"
                              ? "bg-candy-habits text-white rotate-3 scale-105"
                              : "bg-white hover:bg-cream dark:bg-navy-950 dark:hover:bg-navy-800"
                          }`}
                        >
                          {task.status === "completed" && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            >
                              <CheckCircle size={18} className="text-white fill-current" />
                            </motion.div>
                          )}
                        </button>

                        {/* Title, description, due date & tags */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`font-heading font-bold text-base sm:text-lg leading-snug break-words ${
                              task.status === "completed"
                                ? "line-through text-gray-400 dark:text-gray-500"
                                : "text-navy-900 dark:text-white"
                            }`}
                          >
                            {task.title}
                          </h3>

                          {task.description && (
                            <p
                              className={`text-xs sm:text-sm mt-1 line-clamp-2 ${
                                task.status === "completed"
                                  ? "text-gray-400 dark:text-gray-500"
                                  : "text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {task.description}
                            </p>
                          )}

                          {/* Sub-details: Due Date & Tags */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2.5 text-xs">
                            {dueStatus && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-heading font-bold text-[11px] ${
                                  dueStatus.isOverdue
                                    ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800"
                                    : dueStatus.isToday
                                    ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                    : "bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-navy-700"
                                }`}
                              >
                                <Calendar size={12} />
                                {dueStatus.text}
                              </span>
                            )}

                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                {task.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-cream dark:bg-navy-800 border border-black/30 dark:border-white/20 rounded-md text-[10px] font-heading font-bold text-navy-800 dark:text-gray-300"
                                  >
                                    <Tag size={10} />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right section: Category & Priority Badges + Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-navy-800 shrink-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant={task.category} className="capitalize">
                            {task.category}
                          </Badge>
                          {getPriorityBadge(task.priority)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(task._id)}
                          aria-label="Delete task"
                          className="p-2 border-2 border-black dark:border-white rounded-xl bg-white dark:bg-navy-950 text-gray-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Task Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-100 border-2 border-black text-red-700 rounded-xl font-heading text-sm font-bold text-center">
              {formError}
            </div>
          )}

          <Input
            label="Task Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            required
          />

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details..."
            textarea
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={[
                { label: "Low", value: "low" },
                { label: "Medium", value: "medium" },
                { label: "High", value: "high" },
                { label: "Urgent", value: "urgent" },
              ]}
            />
            <Dropdown
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { label: "Personal", value: "personal" },
                { label: "Work", value: "work" },
                { label: "Health", value: "health" },
                { label: "Finance", value: "finance" },
                { label: "Other", value: "other" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Input
              label="Tags (comma-separated)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. urgent, health, bill"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isCreating}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Floating XP Reward Notification Toast */}
      <AnimatePresence>
        {xpToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed bottom-6 right-6 z-50 bg-candy-habits text-white border-4 border-black px-6 py-4 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 font-heading font-bold"
          >
            <Sparkles className="animate-spin" size={20} />
            <span>{xpToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
