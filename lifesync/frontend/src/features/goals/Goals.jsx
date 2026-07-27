import React, { useState } from "react";
import {
  useGetGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useDeleteGoalMutation,
} from "./goalsApi";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Dropdown } from "../../components/ui/Dropdown";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Skeleton } from "../../components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  CheckSquare,
  Square,
  ChevronRight,
  ListTodo,
  Filter,
  Target,
} from "lucide-react";

export default function Goals() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("career");
  const [targetDate, setTargetDate] = useState("");
  const [milestoneInput, setMilestoneInput] = useState("");
  const [milestonesList, setMilestonesList] = useState([]);
  const [formError, setFormError] = useState("");

  // XP toast notifications
  const [xpToast, setXpToast] = useState(null);

  // API hooks
  const { data: goalsRes, isLoading } = useGetGoalsQuery({
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
  });

  const [createGoal, { isLoading: isCreating }] = useCreateGoalMutation();
  const [updateGoal] = useUpdateGoalMutation();
  const [deleteGoal] = useDeleteGoalMutation();

  const handleAddMilestoneToForm = () => {
    if (!milestoneInput.trim()) return;
    setMilestonesList([...milestonesList, { title: milestoneInput.trim(), isCompleted: false }]);
    setMilestoneInput("");
  };

  const handleRemoveMilestoneFromForm = (idx) => {
    setMilestonesList(milestonesList.filter((_, i) => i !== idx));
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Goal title is required");
      return;
    }

    try {
      await createGoal({
        title,
        description,
        category,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        milestones: milestonesList,
      }).unwrap();

      // Reset
      setTitle("");
      setDescription("");
      setCategory("career");
      setTargetDate("");
      setMilestonesList([]);
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err?.data?.message || "Failed to create goal");
    }
  };

  const handleToggleMilestone = async (goal, milestone) => {
    const updatedMilestones = goal.milestones.map((m) => {
      if (m._id === milestone._id) {
        return { ...m, isCompleted: !m.isCompleted };
      }
      // Mongoose expects format: { _id, title, isCompleted }
      return { _id: m._id, title: m.title, isCompleted: m.isCompleted };
    });

    try {
      const res = await updateGoal({
        id: goal._id,
        milestones: updatedMilestones,
      }).unwrap();

      if (res.data.xpInfo) {
        setXpToast(`+${res.data.xpInfo.xpGained} XP Earned!`);
        setTimeout(() => setXpToast(null), 1800);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      try {
        await deleteGoal(id).unwrap();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const goals = goalsRes?.data?.goals || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-heading font-bold text-candy-goals">Goals Tracker</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Set major benchmarks, log milestones, and achieve target goals (+100 XP)
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={18} />
          Create Goal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-navy-900 p-4 border-2 border-black dark:border-white rounded-3xl shadow-retro-sm">
        <div className="flex items-center gap-2 text-sm font-heading font-bold text-gray-500">
          <Filter size={16} />
          <span>Filters:</span>
        </div>
        <div className="w-48">
          <Dropdown
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { label: "All Categories", value: "" },
              { label: "Career", value: "career" },
              { label: "Health", value: "health" },
              { label: "Finance", value: "finance" },
              { label: "Learning", value: "learning" },
              { label: "Relationships", value: "relationship" },
              { label: "Other", value: "other" },
            ]}
          />
        </div>
        <div className="w-48">
          <Dropdown
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: "All Statuses", value: "" },
              { label: "Not Started", value: "not_started" },
              { label: "In Progress", value: "in_progress" },
              { label: "Completed", value: "completed" },
              { label: "Abandoned", value: "abandoned" },
            ]}
          />
        </div>
      </div>

      {/* Goals List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton />
          <Skeleton />
        </div>
      ) : goals.length === 0 ? (
        <Card hoverable={false} className="text-center py-12 border-dashed border-4">
          <div className="mx-auto w-16 h-16 bg-cream border-2 border-black rounded-2xl flex items-center justify-center mb-4">
            <Target size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-1">No goals set yet</h2>
          <p className="text-gray-500 max-w-sm mx-auto text-sm">
            What are your dreams this year? Define a major goal, break it into milestones, and level up!
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const isExpanded = expandedGoalId === goal._id;
            return (
              <Card
                key={goal._id}
                variant="goals"
                hoverable={false}
                className="flex flex-col justify-between bg-white dark:bg-navy-900 border-2 border-black"
              >
                <div>
                  {/* Category & Status Badges */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={goal.category}>{goal.category}</Badge>
                    <Badge variant="secondary" className="uppercase text-[10px]">
                      {(goal.status || "not_started").replace("_", " ")}
                    </Badge>
                  </div>

                  <h3 className="font-heading font-bold text-xl mb-1 text-navy-900 dark:text-white">
                    {goal.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
                    {goal.description || "No description provided."}
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1.5 mb-6">
                    <div className="flex justify-between text-xs font-heading font-bold">
                      <span className="text-gray-500">Milestone Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <ProgressBar progress={goal.progress} color="bg-candy-goals" height="h-3" />
                  </div>
                </div>

                {/* Milestones accordion */}
                <div className="border-t-2 border-black dark:border-white/20 pt-4 space-y-3">
                  <button
                    onClick={() => setExpandedGoalId(isExpanded ? null : goal._id)}
                    className="w-full flex items-center justify-between font-heading font-bold text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <ListTodo size={16} />
                      Milestones ({(goal.milestones || []).filter((m) => m.isCompleted).length}/{(goal.milestones || []).length})
                    </span>
                    <ChevronRight
                      size={18}
                      className={`transform transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-2 mt-2"
                      >
                        {(goal.milestones || []).length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No milestones defined.</p>
                        ) : (
                          (goal.milestones || []).map((milestone) => (
                            <div
                              key={milestone._id}
                              onClick={() => handleToggleMilestone(goal, milestone)}
                              className="flex items-center gap-2.5 p-2 bg-cream-light dark:bg-navy-950/40 rounded-xl border border-gray-200 dark:border-white/10 hover:border-black dark:hover:border-white cursor-pointer transition-colors"
                            >
                              <button className="text-candy-goals shrink-0">
                                {milestone.isCompleted ? (
                                  <CheckSquare size={18} />
                                ) : (
                                  <Square size={18} className="text-gray-400" />
                                )}
                              </button>
                              <span
                                className={`text-xs font-medium truncate ${
                                  milestone.isCompleted
                                    ? "line-through text-gray-400 dark:text-gray-500"
                                    : "text-navy-800 dark:text-gray-200"
                                }`}
                              >
                                {milestone.title}
                              </span>
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer details */}
                <div className="flex items-center justify-between border-t-2 border-black dark:border-white/20 pt-4 mt-6 text-xs text-gray-400">
                  {goal.targetDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteGoal(goal._id)}
                    className="p-1.5 border border-black dark:border-white rounded-lg hover:bg-red-500 hover:text-white dark:hover:bg-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Goal Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Goal">
        <form onSubmit={handleCreateGoal} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-100 border-2 border-black text-red-700 rounded-xl font-heading text-sm font-bold text-center">
              {formError}
            </div>
          )}

          <Input
            label="Goal Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Learn React Native, Save ₹50k"
            required
          />

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is your motivation?"
            textarea
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { label: "Career", value: "career" },
                { label: "Health", value: "health" },
                { label: "Finance", value: "finance" },
                { label: "Learning", value: "learning" },
                { label: "Relationships", value: "relationship" },
                { label: "Other", value: "other" },
              ]}
            />
            <Input
              label="Target Date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          {/* Milestone builder inside form */}
          <div className="space-y-2 border-2 border-black dark:border-white p-4 rounded-2xl bg-cream-light dark:bg-navy-950/40">
            <label className="font-heading font-bold text-sm text-navy-800 dark:text-gray-200">
              Goal Milestones
            </label>
            <div className="flex gap-2">
              <Input
                value={milestoneInput}
                onChange={(e) => setMilestoneInput(e.target.value)}
                placeholder="Milestone title..."
                className="flex-1"
                id="milestone-builder-input"
              />
              <Button type="button" onClick={handleAddMilestoneToForm} className="px-4 py-2 shrink-0">
                Add
              </Button>
            </div>

            {/* List of currently added milestones */}
            {milestonesList.length > 0 && (
              <div className="space-y-1.5 pt-2 max-h-40 overflow-y-auto">
                {milestonesList.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-white dark:bg-navy-900 border border-black rounded-xl text-xs"
                  >
                    <span className="truncate">{m.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestoneFromForm(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isCreating}>
              Create Goal
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
            className="fixed bottom-6 right-6 z-50 bg-candy-goals text-white border-4 border-black px-6 py-4 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 font-heading font-bold"
          >
            <Sparkles className="animate-spin" size={20} />
            <span>{xpToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
