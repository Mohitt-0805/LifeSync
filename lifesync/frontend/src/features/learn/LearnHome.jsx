import React from "react";
import { Link } from "react-router-dom";
import { useGetCoursesQuery } from "./learnApi";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { Badge } from "../../components/ui/Badge";
import { motion } from "framer-motion";
import { BookOpen, Trophy, Zap, ChevronRight, GraduationCap, Star } from "lucide-react";

function ProgressRing({ percent, size = 56, stroke = 5, color = "#10B981" }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="currentColor"
        className="font-heading"
      >
        {percent}%
      </text>
    </svg>
  );
}

const DIFFICULTY_BADGE = {
  beginner: { label: "Beginner", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  intermediate: { label: "Intermediate", cls: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  advanced: { label: "Advanced", cls: "bg-red-100 text-red-700 border-red-300" },
};

export default function LearnHome() {
  const { data: res, isLoading } = useGetCoursesQuery();
  const courses = res?.data || [];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold" style={{ color: "#10B981" }}>
            Financial Learn
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Level up your money IQ — earn XP for every lesson you complete
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-black rounded-2xl">
          <GraduationCap size={20} className="text-emerald-600" />
          <span className="font-heading font-bold text-sm text-emerald-700 dark:text-emerald-400">
            Learn → Earn XP
          </span>
        </div>
      </div>

      {/* ── How It Works Banner ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: BookOpen, color: "bg-blue-100 text-blue-600", title: "Read Lessons", desc: "Rich content written for real life, not textbooks" },
          { icon: Star, color: "bg-yellow-100 text-yellow-600", title: "Take Quizzes", desc: "Test your knowledge with scenario-based questions" },
          { icon: Zap, color: "bg-emerald-100 text-emerald-600", title: "Earn XP", desc: "Score higher on quizzes to earn more XP toward your level" },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div
            key={title}
            className="flex items-start gap-3 p-4 bg-white dark:bg-navy-900 border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className={`p-2 rounded-xl border-2 border-black ${color} shrink-0`}>
              <Icon size={18} />
            </div>
            <div>
              <div className="font-heading font-bold text-sm text-navy-900 dark:text-white">{title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Course Cards ── */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : courses.length === 0 ? (
        <Card hoverable={false} className="text-center py-16 border-dashed border-4">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <h2 className="text-xl font-heading font-bold text-gray-400">No courses available yet</h2>
          <p className="text-sm text-gray-400 mt-1">Check back soon — new content drops regularly.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {courses.map((course, i) => {
            const prog = course.userProgress || {};
            const diff = DIFFICULTY_BADGE[course.difficulty] || DIFFICULTY_BADGE.beginner;
            const isCompleted = prog.isCompleted;

            return (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link to={`/learn/${course._id}`} className="group block">
                  <div className="relative bg-white dark:bg-navy-900 border-2 border-black rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {isCompleted && (
                      <div className="absolute top-4 right-4 flex items-center gap-1 bg-emerald-500 text-white text-xs font-heading font-bold px-2.5 py-1 rounded-full border-2 border-black">
                        <Trophy size={12} />
                        Completed!
                      </div>
                    )}

                    <div className="flex items-start gap-5">
                      {/* Emoji + ring */}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <div
                          className="w-16 h-16 rounded-2xl border-2 border-black flex items-center justify-center text-3xl shadow-retro-sm"
                          style={{ backgroundColor: course.accentColor + "20" }}
                        >
                          {course.coverEmoji}
                        </div>
                        <ProgressRing percent={prog.progressPercent || 0} color={course.accentColor || "#10B981"} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-heading font-bold px-2 py-0.5 rounded-full border ${diff.cls}`}
                          >
                            {diff.label}
                          </span>
                          <span className="text-xs text-gray-400 font-heading">
                            {course.category}
                          </span>
                        </div>

                        <h2 className="text-xl font-heading font-bold text-navy-900 dark:text-white leading-snug">
                          {course.title}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {course.description}
                        </p>

                        <div className="flex items-center gap-5 mt-3 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-gray-500">
                            <BookOpen size={14} />
                            {prog.completedLessons || 0} / {prog.totalLessons || course.totalLessons || 0} lessons
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-emerald-600">
                            <Zap size={14} />
                            {course.totalXp} XP total
                          </div>
                        </div>
                      </div>

                      <ChevronRight
                        size={22}
                        className="text-gray-400 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 self-center"
                      />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
