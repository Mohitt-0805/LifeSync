import React, { useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useGetLessonByIdQuery, useCompleteLessonMutation } from "./learnApi";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Sparkles,
  X,
  Zap,
  BookOpen,
  ChevronRight,
} from "lucide-react";

// ── Markdown renderer styles ──────────────────────────────────────────────────
const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-heading font-bold text-navy-900 dark:text-white mt-6 mb-3 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-heading font-bold text-navy-900 dark:text-white mt-8 mb-3 pb-2 border-b-2 border-black/10 dark:border-white/10">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-heading font-bold text-navy-900 dark:text-white mt-5 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="space-y-1.5 mb-4 pl-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1.5 mb-4 pl-1 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-heading font-bold text-navy-900 dark:text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-gray-600 dark:text-gray-400">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-emerald-500 pl-4 py-1 my-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-r-xl text-gray-700 dark:text-gray-300 italic">
      {children}
    </blockquote>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="bg-gray-100 dark:bg-navy-800 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono text-sm border border-gray-200 dark:border-white/10">
        {children}
      </code>
    ) : (
      <pre className="bg-navy-900 dark:bg-navy-950 text-gray-200 p-4 rounded-2xl border-2 border-black overflow-x-auto my-4 text-sm font-mono leading-relaxed">
        <code>{children}</code>
      </pre>
    ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-2xl border-2 border-black shadow-retro-sm">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-navy-900 dark:bg-navy-950 text-white">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left font-heading font-bold text-xs uppercase tracking-wide">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 border-t border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-300">
      {children}
    </td>
  ),
  hr: () => <hr className="border-t-2 border-dashed border-gray-200 dark:border-white/10 my-6" />,
};

// ── Quiz Component ────────────────────────────────────────────────────────────
function QuizSection({ quiz, onSubmit, isSubmitting, alreadyCompleted, quizScore }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(alreadyCompleted);
  const [results, setResults] = useState(null);

  const handleSelect = (questionId, optionId) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < quiz.length) return;

    const answerPayload = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
      questionId,
      selectedOptionId,
    }));

    const result = await onSubmit(answerPayload);
    setSubmitted(true);
    setResults(result);
  };

  const allAnswered = Object.keys(answers).length === quiz.length;

  if (alreadyCompleted && !results) {
    return (
      <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-400 rounded-3xl text-center">
        <Check size={32} className="mx-auto text-emerald-500 mb-2" />
        <div className="font-heading font-bold text-emerald-700 dark:text-emerald-400 text-lg">
          Lesson Already Completed
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Your quiz score: <span className="font-bold text-emerald-600">{quizScore}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 border-2 border-black rounded-xl">
          <Sparkles size={20} className="text-yellow-600" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-navy-900 dark:text-white">
            Knowledge Check
          </h2>
          <p className="text-sm text-gray-500">
            {submitted ? "Quiz complete!" : `Answer all ${quiz.length} questions to complete this lesson`}
          </p>
        </div>
      </div>

      {quiz.map((question, qi) => {
        const selectedId = answers[question._id];
        const correctOption = (question.options || []).find((o) => o.isCorrect);
        const isCorrect = submitted && selectedId === correctOption?._id;
        const isWrong = submitted && selectedId && selectedId !== correctOption?._id;

        return (
          <motion.div
            key={question._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: qi * 0.06 }}
            className={`p-5 rounded-2xl border-2 ${
              submitted
                ? isCorrect
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                  : "border-red-300 bg-red-50 dark:bg-red-950/20"
                : "border-black bg-white dark:bg-navy-900"
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`w-7 h-7 rounded-lg border-2 border-black flex items-center justify-center shrink-0 font-heading font-bold text-xs ${
                  submitted && isCorrect
                    ? "bg-emerald-500 text-white border-emerald-600"
                    : submitted && isWrong
                    ? "bg-red-500 text-white border-red-600"
                    : "bg-yellow-200 text-navy-900"
                }`}
              >
                {submitted ? (isCorrect ? <Check size={14} /> : <X size={14} />) : qi + 1}
              </div>
              <p className="font-heading font-bold text-navy-900 dark:text-white leading-snug">
                {question.question}
              </p>
            </div>

            <div className="space-y-2 ml-10">
              {(question.options || []).map((option) => {
                const isSelected = selectedId === option._id;
                const isThisCorrect = submitted && option.isCorrect;
                const isThisWrong = submitted && isSelected && !option.isCorrect;

                return (
                  <button
                    key={option._id}
                    onClick={() => handleSelect(question._id, option._id)}
                    disabled={submitted}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 font-heading text-sm transition-all duration-150 ${
                      submitted
                        ? isThisCorrect
                          ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-bold"
                          : isThisWrong
                          ? "border-red-400 bg-red-100 dark:bg-red-900/30 text-red-700 line-through opacity-70"
                          : "border-gray-200 dark:border-white/10 text-gray-400 opacity-50"
                        : isSelected
                        ? "border-black bg-navy-900 text-white shadow-retro-sm scale-[0.99]"
                        : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-navy-800/50 text-navy-800 dark:text-gray-300 hover:border-black dark:hover:border-white hover:bg-white dark:hover:bg-navy-800 cursor-pointer"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {submitted && isThisCorrect && <Check size={14} className="shrink-0" />}
                      {submitted && isThisWrong && <X size={14} className="shrink-0" />}
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Explanation after submit */}
            {submitted && question.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="ml-10 mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300"
              >
                <span className="font-bold">Explanation: </span>
                {question.explanation}
              </motion.div>
            )}
          </motion.div>
        );
      })}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || isSubmitting}
          className={`w-full py-4 rounded-2xl border-2 border-black font-heading font-bold text-base transition-all duration-150 ${
            allAnswered && !isSubmitting
              ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              : "bg-gray-100 dark:bg-navy-800 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting
            ? "Grading..."
            : allAnswered
            ? "Submit Quiz & Complete Lesson ✓"
            : `Answer all ${quiz.length - Object.keys(answers).length} remaining question${quiz.length - Object.keys(answers).length !== 1 ? "s" : ""}`}
        </button>
      )}

      {submitted && results && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-2 border-emerald-400 rounded-3xl text-center"
        >
          <div className="text-4xl mb-2">
            {results.quizResults?.score >= 80 ? "🏆" : results.quizResults?.score >= 50 ? "⭐" : "📚"}
          </div>
          <div className="font-heading font-bold text-2xl text-emerald-700 dark:text-emerald-400">
            {results.quizResults?.score}% Score
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {results.quizResults?.correct} / {results.quizResults?.total} correct
          </div>
          {results.xpInfo && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 border-2 border-black rounded-full font-heading font-bold text-sm">
              <Zap size={16} className="text-yellow-600" />
              +{results.xpInfo.xpAwarded} XP Earned!
              {results.xpInfo.leveledUp && (
                <span className="text-brand ml-1">🎉 Level Up!</span>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ── Main LessonView ───────────────────────────────────────────────────────────
export default function LessonView() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const { data: res, isLoading } = useGetLessonByIdQuery(lessonId);
  const [completeLesson, { isLoading: isSubmitting }] = useCompleteLessonMutation();

  const lesson = res?.data?.lesson;
  const userProgress = res?.data?.userProgress;

  const [completionResult, setCompletionResult] = useState(null);

  const handleQuizSubmit = useCallback(
    async (answers) => {
      try {
        const result = await completeLesson({ lessonId, answers }).unwrap();
        setCompletionResult(result.data);
        return result.data;
      } catch (err) {
        console.error("Failed to complete lesson", err);
        return null;
      }
    },
    [lessonId, completeLesson]
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-navy-800 rounded-xl w-1/3" />
        <div className="h-4 bg-gray-200 dark:bg-navy-800 rounded w-1/2" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-navy-800 rounded" style={{ width: `${85 - i * 5}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-24 text-gray-400 max-w-xl mx-auto">
        <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
        <p className="font-heading font-bold text-xl">Lesson not found</p>
        <Link to={`/learn/${courseId}`} className="text-emerald-600 underline text-sm mt-2 block">
          ← Back to Course
        </Link>
      </div>
    );
  }

  const alreadyCompleted = userProgress?.completed || completionResult?.alreadyCompleted;

  return (
    <div className="max-w-3xl mx-auto">
      {/* ── Breadcrumb nav ── */}
      <div className="flex items-center gap-2 text-sm font-heading font-bold text-gray-400 mb-6 flex-wrap">
        <Link to="/learn" className="hover:text-black dark:hover:text-white transition-colors">
          Learn
        </Link>
        <ChevronRight size={14} />
        <Link
          to={`/learn/${courseId}`}
          className="hover:text-black dark:hover:text-white transition-colors truncate"
        >
          Course
        </Link>
        <ChevronRight size={14} />
        <span className="text-navy-800 dark:text-white truncate">{lesson.title}</span>
      </div>

      {/* ── Lesson header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 border-2 border-black rounded-xl text-xs font-heading font-bold text-emerald-700">
            Lesson {lesson.order}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-heading font-bold">
            <Clock size={12} />
            {lesson.estimatedReadTime} min read
          </div>
          <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-yellow-600">
            <Zap size={12} />
            Up to {lesson.xpReward} XP
          </div>
          {alreadyCompleted && (
            <div className="flex items-center gap-1 text-xs font-heading font-bold text-emerald-600">
              <Check size={12} strokeWidth={3} />
              Done
            </div>
          )}
        </div>
        <h1 className="text-3xl font-heading font-bold text-navy-900 dark:text-white">
          {lesson.title}
        </h1>
      </div>

      {/* ── Lesson content (Markdown) ── */}
      <div className="prose max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {lesson.content}
        </ReactMarkdown>
      </div>

      {/* ── Quiz section (only show if there are questions) ── */}
      {(lesson.quiz || []).length > 0 ? (
        <QuizSection
          quiz={lesson.quiz}
          onSubmit={handleQuizSubmit}
          isSubmitting={isSubmitting}
          alreadyCompleted={alreadyCompleted}
          quizScore={userProgress?.quizScore}
        />
      ) : (
        // No quiz — mark complete directly
        !alreadyCompleted && (
          <div className="mt-8">
            <button
              onClick={() => handleQuizSubmit([])}
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl border-2 border-black bg-emerald-500 text-white font-heading font-bold text-base hover:bg-emerald-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
            >
              {isSubmitting ? "Saving..." : "Mark Lesson Complete ✓"}
            </button>
          </div>
        )
      )}

      {/* ── Navigation ── */}
      <div className="mt-10 flex justify-between gap-4 border-t-2 border-black/10 dark:border-white/10 pt-6">
        <button
          onClick={() => navigate(`/learn/${courseId}`)}
          className="flex items-center gap-2 px-5 py-2.5 border-2 border-black dark:border-white rounded-2xl font-heading font-bold text-sm hover:bg-cream-dark dark:hover:bg-navy-800 transition-colors active-press"
        >
          <ArrowLeft size={16} />
          Back to Course
        </button>

        {(alreadyCompleted || completionResult) && (
          <button
            onClick={() => navigate(`/learn/${courseId}`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white border-2 border-black rounded-2xl font-heading font-bold text-sm shadow-retro-sm hover:shadow-retro hover:-translate-y-0.5 transition-all active-press"
          >
            Next Lesson
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
