import React, { useState } from "react";
import {
  useGetClassesQuery,
  useAddClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
} from "./timetableApi";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Dropdown } from "../../components/ui/Dropdown";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { Plus, Trash2, Clock, MapPin, BookOpen, Calendar, Edit2 } from "lucide-react";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const COLOR_OPTIONS = [
  { label: "Blue", value: "#3b6cff" },
  { label: "Red / Coral", value: "#ff4d3d" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Green", value: "#1fb37a" },
  { label: "Amber", value: "#ffa826" },
  { label: "Teal", value: "#14b8a6" },
];

export default function Timetable() {
  const { data: classesRes, isLoading } = useGetClassesQuery();
  const [addClass, { isLoading: isAdding }] = useAddClassMutation();
  const [updateClass] = useUpdateClassMutation();
  const [deleteClass] = useDeleteClassMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  // Form states
  const [subjectName, setSubjectName] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("Mon");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [room, setRoom] = useState("");
  const [color, setColor] = useState("#3b6cff");
  const [recurring, setRecurring] = useState(true);
  const [formError, setFormError] = useState("");

  const classes = classesRes?.data || [];

  const handleOpenAddModal = (defaultDay = "Mon") => {
    setEditingClass(null);
    setSubjectName("");
    setDayOfWeek(defaultDay);
    setStartTime("09:00");
    setEndTime("10:00");
    setRoom("");
    setColor("#3b6cff");
    setRecurring(true);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingClass(item);
    setSubjectName(item.subjectName || "");
    setDayOfWeek(item.dayOfWeek || "Mon");
    setStartTime(item.startTime || "09:00");
    setEndTime(item.endTime || "10:00");
    setRoom(item.room || "");
    setColor(item.color || "#3b6cff");
    setRecurring(item.recurring !== false);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!subjectName.trim()) {
      setFormError("Subject name is required");
      return;
    }

    try {
      if (editingClass) {
        await updateClass({
          id: editingClass._id,
          subjectName: subjectName.trim(),
          dayOfWeek,
          startTime,
          endTime,
          room: room.trim(),
          color,
          recurring,
        }).unwrap();
      } else {
        await addClass({
          subjectName: subjectName.trim(),
          dayOfWeek,
          startTime,
          endTime,
          room: room.trim(),
          color,
          recurring,
        }).unwrap();
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err?.data?.message || "Failed to save class schedule");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this class from your timetable?")) {
      try {
        await deleteClass(id).unwrap();
        setIsModalOpen(false);
      } catch (err) {
        console.error("Failed to delete class", err);
      }
    }
  };

  // Group classes by day of week
  const classesByDay = {};
  DAYS_OF_WEEK.forEach((day) => {
    classesByDay[day] = classes.filter((c) => c.dayOfWeek === day);
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-heading font-bold text-[#3b6cff] flex items-center gap-2">
            <BookOpen size={36} />
            Class Timetable
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Set your semester schedule once to populate your dashboard's Next Class widget
          </p>
        </div>

        <Button onClick={() => handleOpenAddModal()} className="flex items-center gap-2">
          <Plus size={18} />
          Add Class
        </Button>
      </div>

      {/* Weekly Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {DAYS_OF_WEEK.map((day) => {
            const dayClasses = classesByDay[day] || [];
            const isToday =
              day === ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];

            return (
              <div
                key={day}
                className={`bg-white dark:bg-navy-900 border-2 border-[#15151a] dark:border-white rounded-[18px] p-5 flex flex-col justify-between transition-all ${
                  isToday
                    ? "ring-2 ring-[#3b6cff] shadow-[4px_4px_0px_0px_rgba(59,108,255,1)]"
                    : "shadow-[4px_4px_0px_0px_rgba(21,21,26,1)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b-2 border-[#15151a] dark:border-white pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-lg text-navy-900 dark:text-white uppercase tracking-wider">
                        {day}
                      </span>
                      {isToday && (
                        <span className="bg-[#3b6cff] text-white text-[10px] font-heading font-bold px-2 py-0.5 rounded-full border border-black">
                          Today
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(day)}
                      className="p-1 border border-black/20 rounded-lg hover:bg-cream dark:hover:bg-navy-800 transition-colors"
                      title={`Add class to ${day}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {dayClasses.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 font-heading text-xs italic">
                      No classes scheduled
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayClasses.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => handleOpenEditModal(item)}
                          className="p-3 rounded-xl border-2 border-[#15151a] dark:border-white bg-[#f8fa4e]/10 hover:scale-[1.02] spring-transition cursor-pointer relative group"
                          style={{
                            borderLeftWidth: "6px",
                            borderLeftColor: item.color || "#3b6cff",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-heading font-bold text-sm text-navy-900 dark:text-white truncate">
                              {item.subjectName}
                            </span>
                            <Edit2 size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1 font-heading font-bold">
                              <Clock size={12} className="text-[#3b6cff]" />
                              {item.startTime} - {item.endTime}
                            </span>
                            {item.room && (
                              <span className="flex items-center gap-1">
                                <MapPin size={12} />
                                {item.room}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-navy-800 text-[10px] font-heading font-bold text-gray-400 text-right">
                  {dayClasses.length} class{dayClasses.length !== 1 ? "es" : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Class Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? "Edit Class Schedule" : "Add Class to Timetable"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-100 border-2 border-black text-red-700 rounded-xl font-heading text-sm font-bold text-center">
              {formError}
            </div>
          )}

          <Input
            label="Subject Name *"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="e.g. Physics 101, Computer Networks"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              label="Day of Week *"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              options={DAYS_OF_WEEK.map((d) => ({ label: d, value: d }))}
            />
            <Dropdown
              label="Accent Color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              options={COLOR_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time *"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time *"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <Input
            label="Room / Hall Number"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="e.g. Room 302, Science Block B"
          />

          <div className="flex items-center justify-between pt-4 border-t border-black/10">
            {editingClass ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => handleDelete(editingClass._id)}
                className="flex items-center gap-1"
              >
                <Trash2 size={16} /> Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isAdding}>
                {editingClass ? "Save Changes" : "Add Class"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
