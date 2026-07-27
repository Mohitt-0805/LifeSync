import React from "react";
import { Link, useParams } from "react-router-dom";
import { useGetCourseByIdQuery } from "./learnApi";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Lock,
  Trophy,
  Zap,
} from "lucide-react";

function CourseProgressBar({ percent, color }) {
  return (
    <div className="w-full bg-gray-200 dark:bg-navy-800 rounded-full h-3 border border-black/20 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function CourseView() {
  const { courseId } = useParams();
  const { data: res, isLoading } = useGetCourseByIdQuery(courseId);

  const course = res?.data?.course;
  const lessons = res?.data?.lessons || [];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-24 text-gray-400">
        <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
        <p className="font-heading font-bold text-xl">Course not found</p>
        <Link to="/learn" className="text-emerald-600 underline text-sm mt-2 block">
          ← Back to Learn
        </Link>
      </div>
    );
  }

  const prog = course.userProgress || {};
  const accentColor = course.accentColor || "#10B981";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        to="/learn"
        className="inline-flex items-center gap-2 text-sm font-heading font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> All Courses
      </Link>

      {/* ── Course Hero Card ── */}
      <div
        className="relative rounded-3xl border-2 border-black p-7 overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
        style={{ backgroundColor: accentColor + "15" }}
      >
        <div className="absolute top-0 right-0 text-[120px] leading-none opacity-10 pointer-events-none select-none pr-4 -mt-2">
          {course.coverEmoji}
        </div>

        <div className="relative z-10">
          <div className="text-5xl mb-3">{course.coverEmoji}</div>
          <h1 className="text-3xl font-heading font-bold text-navy-900 dark:text-white">
            {course.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-xl">
            {course.description}
          </p>

          <div className="flex flex-wrap gap-4 mt-5">
            <div className="flex items-center gap-2 text-sm font-heading font-bold">
              <BookOpen size={16} style={{ color: accentColor }} />
              {lessons.length} Lessons
            </div>
            <div className="flex items-center gap-2 text-sm font-heading font-bold text-emerald-600">
              <Zap size={16} />
              {course.totalXp} XP Available
            </div>
            {prog.isCompleted && (
              <div className="flex items-center gap-2 text-sm font-heading font-bold text-emerald-600">
                <Trophy size={16} />
                Course Complete!
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs font-heading font-bold text-gray-500 mb-1.5">
              <span>Your Progress</span>
              <span>
                {prog.completedLessons || 0} / {prog.totalLessons || lessons.length} lessons
              </span>
            </div>
            <CourseProgressBar percent={prog.progressPercent || 0} color={accentColor} />
          </div>
        </div>
      </div>

      {/* ── Lessons List ── */}
      <div className="space-y-3">
        <h2 className="font-heading font-bold text-lg text-navy-900 dark:text-white">
          Lessons
        </h2>

        {lessons.map((lesson, idx) => {
          const lessonProg = lesson.userProgress;
          const isDone = lessonProg?.completed;
          // Allow unlocking lessons progressively (first lesson always open; rest open if previous done)
          const prevDone = idx === 0 || lessons[idx - 1]?.userProgress?.completed;
          const isLocked = !prevDone && !isDone;

          return (
            <motion.div
              key={lesson._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              {isLocked ? (
                // Locked state — not clickable
                <div className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-navy-900/50 border-2 border-gray-200 dark:border-white/10 rounded-2xl opacity-60 cursor-not-allowed">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-navy-800 border-2 border-gray-300 flex items-center justify-center shrink-0">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-400 font-heading font-bold uppercase mb-0.5">
                      Lesson {lesson.order}
                    </div>
                    <div className="font-heading font-bold text-gray-400 truncate">
                      {lesson.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Complete the previous lesson to unlock
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-heading font-bold text-gray-400 shrink-0">
                    <Zap size={12} />
                    {lesson.xpReward} XP
                  </div>
                </div>
              ) : (
                <Link to={`/learn/${courseId}/lesson/${lesson._id}`} className="group block">
                  <div
                    className={`flex items-center gap-4 p-5 border-2 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                      isDone
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600 shadow-[3px_3px_0px_0px_rgba(16,185,129,0.4)]"
                        : "bg-white dark:bg-navy-900 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    }`}
                  >
                    {/* Status icon */}
                    <div
                      className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 font-heading font-bold text-sm ${
                        isDone
                          ? "bg-emerald-500 border-emerald-600 text-white"
                          : "bg-white dark:bg-navy-800 border-black text-navy-800 dark:text-white"
                      }`}
                    >
                      {isDone ? <Check size={18} strokeWidth={3} /> : lesson.order}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-heading font-bold uppercase mb-0.5 ${
                          isDone ? "text-emerald-600" : "text-gray-400"
                        }`}
                      >
                        Lesson {lesson.order}
                      </div>
                      <div className="font-heading font-bold text-navy-900 dark:text-white truncate">
                        {lesson.title}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-gray-400 font-heading">
                          <Clock size={11} />
                          {lesson.estimatedReadTime} min read
                        </span>
                        {(lesson.quiz || []).length > 0 && (
                          <span className="text-xs text-gray-400 font-heading">
                            · {lesson.quiz.length} quiz question{lesson.quiz.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {isDone && lessonProg?.quizScore != null && (
                          <span className="text-xs font-heading font-bold text-emerald-600">
                            · Quiz: {lessonProg.quizScore}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* XP + arrow */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div
                        className={`flex items-center gap-1 text-xs font-heading font-bold px-2.5 py-1 rounded-full border ${
                          isDone
                            ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                            : "bg-yellow-50 text-yellow-700 border-yellow-300"
                        }`}
                      >
                        <Zap size={11} />
                        {isDone ? `+${lessonProg?.xpAwarded || lesson.xpReward}` : lesson.xpReward} XP
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-gray-400 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all"
                      />
                    </div>
                  </div>
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>

      {prog.isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-2 border-emerald-400 rounded-3xl"
        >
          <div className="text-5xl mb-2">🎓</div>
          <div className="font-heading font-bold text-xl text-emerald-700 dark:text-emerald-400">
            Course Complete!
          </div>
          <p className="text-sm text-gray-500 mt-1">You've mastered all lessons. Achievement unlocked.</p>
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-emerald-500 text-white font-heading font-bold border-2 border-black rounded-2xl shadow-retro-sm hover:shadow-retro transition-all"
          >
            <BookOpen size={16} /> Explore More Courses
          </Link>
        </motion.div>
      )}
    </div>
  );
}
