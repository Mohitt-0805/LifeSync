import React, { useState } from "react";
import {
  useGetHabitsQuery,
  useCreateHabitMutation,
  useToggleHabitMutation,
  useDeleteHabitMutation,
} from "./habitsApi";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Dropdown } from "../../components/ui/Dropdown";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Flame, Sparkles, Check, CheckSquare } from "lucide-react";

export default function Habits() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [targetDays, setTargetDays] = useState(1);
  const [formError, setFormError] = useState("");

  const [xpToast, setXpToast] = useState(null);

  // Queries & Mutations
  const { data: habitsRes, isLoading } = useGetHabitsQuery();
  const [createHabit, { isLoading: isCreating }] = useCreateHabitMutation();
  const [toggleHabit] = useToggleHabitMutation();
  const [deleteHabit] = useDeleteHabitMutation();

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Habit title is required");
      return;
    }

    try {
      await createHabit({
        title,
        description,
        frequency,
        targetDays: parseInt(targetDays) || 1,
      }).unwrap();

      setTitle("");
      setDescription("");
      setFrequency("daily");
      setTargetDays(1);
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err?.data?.message || "Failed to create habit");
    }
  };

  const handleToggleLog = async (habitId) => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await toggleHabit({ id: habitId, date: todayStr }).unwrap();

      if (res.data.xpInfo && res.data.isCompletedToday) {
        setXpToast("+15 XP Streak Boost!");
        setTimeout(() => setXpToast(null), 1800);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHabit = async (id) => {
    if (window.confirm("Are you sure you want to delete this habit? All history logs will be lost!")) {
      try {
        await deleteHabit(id).unwrap();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Helper: Generate array of dates for the last 30 days
  const getLast30Days = () => {
    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  const last30Days = getLast30Days();
  const habits = habitsRes?.data || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-heading font-bold text-candy-habits">Habit Builder</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Build consistency, preserve streaks, and stack XP (+15 XP per log)
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={18} />
          Create Habit
        </Button>
      </div>

      {/* Habits List & Heatmaps */}
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton />
          <Skeleton />
        </div>
      ) : habits.length === 0 ? (
        <Card hoverable={false} className="text-center py-12 border-dashed border-4">
          <div className="mx-auto w-16 h-16 bg-cream border-2 border-black rounded-2xl flex items-center justify-center mb-4">
            <Flame size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-1">No habits defined</h2>
          <p className="text-gray-500 max-w-sm mx-auto text-sm">
            What micro-routines would you like to build daily? Add a habit to track streaks and heatmaps.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {habits.map((habit) => {
            const completedDaysMap = {};
            habit.logs?.forEach((log) => {
              if (log.status === "completed") {
                completedDaysMap[log.date] = true;
              }
            });

            return (
              <Card
                key={habit._id}
                variant="habits"
                hoverable={false}
                className="bg-white dark:bg-navy-900 border-2 border-black p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Info Column */}
                  <div className="flex items-start gap-4 flex-1">
                    <button
                      onClick={() => handleToggleLog(habit._id)}
                      className={`w-12 h-12 rounded-2xl border-2 border-black flex items-center justify-center spring-transition cursor-pointer shrink-0 ${
                        habit.isCompletedToday
                          ? "bg-candy-habits text-white rotate-6 scale-105"
                          : "bg-white hover:bg-cream dark:bg-navy-950 dark:hover:bg-navy-850"
                      }`}
                    >
                      {habit.isCompletedToday ? (
                        <Check size={24} className="stroke-[3]" />
                      ) : (
                        <Flame size={20} className="text-gray-400" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-heading font-bold text-xl text-navy-900 dark:text-white truncate">
                          {habit.title}
                        </h3>
                        <Badge variant="secondary" className="uppercase text-[9px]">
                          {habit.frequency}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                        {habit.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Streak Stats Panel */}
                  <div className="flex items-center gap-6 bg-cream-light dark:bg-navy-950 border-2 border-black rounded-2xl p-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <Flame size={24} className="text-brand fill-brand animate-pulse" />
                      <div className="text-left">
                        <div className="text-[10px] font-heading font-bold text-gray-500 uppercase leading-none">
                          Current Streak
                        </div>
                        <div className="text-xl font-heading font-bold text-navy-900 dark:text-white">
                          {habit.streak} days
                        </div>
                      </div>
                    </div>

                    <div className="border-l-2 border-black dark:border-white/20 h-8" />

                    <div className="text-left">
                      <div className="text-[10px] font-heading font-bold text-gray-500 uppercase leading-none">
                        Best Streak
                      </div>
                      <div className="text-xl font-heading font-bold text-navy-900 dark:text-white">
                        {habit.bestStreak} days
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleDeleteHabit(habit._id)}
                    className="self-start lg:self-center p-2 border-2 border-black dark:border-white rounded-xl hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Heatmap Grid Calendar */}
                <div className="border-t-2 border-black dark:border-white/20 pt-4 mt-6">
                  <h4 className="font-heading font-bold text-xs text-gray-500 dark:text-gray-400 mb-3 uppercase">
                    30-Day Activity Heatmap
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {last30Days.map((dateStr) => {
                      const isCompleted = completedDaysMap[dateStr];
                      const dateObj = new Date(dateStr);
                      const displayTitle = `${dateObj.toLocaleDateString()}: ${
                        isCompleted ? "Completed" : "No Log"
                      }`;

                      return (
                        <div
                          key={dateStr}
                          title={displayTitle}
                          className={`w-5 h-5 rounded-md border border-black/20 dark:border-white/10 ${
                            isCompleted
                              ? "bg-candy-habits shadow-retro-sm hover:scale-110"
                              : "bg-cream-dark dark:bg-navy-950 hover:bg-gray-300 dark:hover:bg-navy-800"
                          } transition-all spring-transition cursor-help`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-heading font-bold">
                    <span>30 days ago</span>
                    <span>Today</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Habit Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Habit">
        <form onSubmit={handleCreateHabit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-100 border-2 border-black text-red-700 rounded-xl font-heading text-sm font-bold text-center">
              {formError}
            </div>
          )}

          <Input
            label="Habit Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Read 15 mins, Drink 3L water"
            required
          />

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why is this routine important?"
            textarea
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              label="Frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              options={[
                { label: "Daily", value: "daily" },
                { label: "Weekly", value: "weekly" },
              ]}
            />
            <Input
              label="Target Times Per Period"
              type="number"
              min={1}
              value={targetDays}
              onChange={(e) => setTargetDays(e.target.value)}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isCreating}>
              Create Habit
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
