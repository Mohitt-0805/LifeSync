import { Course } from "../models/Course.js";
import { Lesson } from "../models/Lesson.js";
import { UserLessonProgress } from "../models/UserLessonProgress.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rewardXP, checkAndUnlockAchievement } from "../utils/gamification.js";

// ─── GET /api/v1/courses ──────────────────────────────────────────────────────
// Returns all published courses, each annotated with the user's completion progress.
const getCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ isPublished: true });
  const userId = req.user._id;

  // Annotate each course with user's completed lesson count
  const coursesWithProgress = await Promise.all(
    courses.map(async (course) => {
      const completedCount = await UserLessonProgress.countDocuments({
        user: userId,
        course: course._id,
        completed: true,
      });

      const totalLessons = course.totalLessons || 0;
      const progressPercent =
        totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      return {
        ...(typeof course.toObject === "function" ? course.toObject() : { ...course }),
        userProgress: {
          completedLessons: completedCount,
          totalLessons,
          progressPercent,
          isCompleted: completedCount >= totalLessons && totalLessons > 0,
        },
      };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, coursesWithProgress, "Courses retrieved successfully"));
});

// ─── GET /api/v1/courses/:courseId ───────────────────────────────────────────
// Returns a single course with all its lessons and per-lesson progress for this user.
const getCourseById = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const course = await Course.findOne({ _id: courseId, isPublished: true });
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Fetch lessons ordered
  const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });

  // Fetch all user progress records for this course in one query
  const progressRecords = await UserLessonProgress.find({
    user: userId,
    course: courseId,
  });

  const progressMap = {};
  progressRecords.forEach((p) => {
    progressMap[p.lesson.toString()] = p;
  });

  // Annotate each lesson with user's progress (quiz/answers hidden in list)
  const lessonsWithProgress = lessons.map((lesson) => {
    const lessonId = lesson._id.toString();
    const progress = progressMap[lessonId] || null;

    const lessonObj =
      typeof lesson.toObject === "function" ? lesson.toObject() : { ...lesson };

    // Don't expose correct answers in the lesson list — only in detail view
    const sanitizedLesson = {
      ...lessonObj,
      quiz: (lessonObj.quiz || []).map((q) => ({
        _id: q._id,
        question: q.question,
        options: (q.options || []).map((o) => ({
          _id: o._id,
          label: o.label,
          // isCorrect is hidden here — exposed only when lesson is completed
        })),
        explanation: progress?.completed ? q.explanation : undefined,
      })),
    };

    return {
      ...sanitizedLesson,
      userProgress: progress
        ? {
            completed: progress.completed,
            quizScore: progress.quizScore,
            xpAwarded: progress.xpAwarded,
            completedAt: progress.completedAt,
          }
        : null,
    };
  });

  const completedCount = progressRecords.filter((p) => p.completed).length;
  const totalLessons = lessons.length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        course: {
          ...(typeof course.toObject === "function" ? course.toObject() : { ...course }),
          userProgress: {
            completedLessons: completedCount,
            totalLessons,
            progressPercent: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
            isCompleted: completedCount >= totalLessons && totalLessons > 0,
          },
        },
        lessons: lessonsWithProgress,
      },
      "Course retrieved successfully"
    )
  );
});

// ─── GET /api/v1/lessons/:lessonId ───────────────────────────────────────────
// Returns a single lesson with full content and quiz (with correct answers if already completed).
const getLessonById = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user._id;

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new ApiError(404, "Lesson not found");
  }

  const progress = await UserLessonProgress.findOne({
    user: userId,
    lesson: lessonId,
  });

  const lessonObj =
    typeof lesson.toObject === "function" ? lesson.toObject() : { ...lesson };

  // Expose correct answers + explanations if lesson is already completed
  const withAnswers = progress?.completed;

  const sanitizedLesson = {
    ...lessonObj,
    quiz: (lessonObj.quiz || []).map((q) => ({
      _id: q._id,
      question: q.question,
      options: (q.options || []).map((o) => ({
        _id: o._id,
        label: o.label,
        ...(withAnswers ? { isCorrect: o.isCorrect } : {}),
      })),
      ...(withAnswers ? { explanation: q.explanation } : {}),
    })),
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        lesson: sanitizedLesson,
        userProgress: progress
          ? {
              completed: progress.completed,
              quizScore: progress.quizScore,
              xpAwarded: progress.xpAwarded,
              completedAt: progress.completedAt,
            }
          : null,
      },
      "Lesson retrieved successfully"
    )
  );
});

// ─── POST /api/v1/lessons/:lessonId/complete ─────────────────────────────────
// Marks a lesson complete, scores the quiz, awards XP.
// Body: { answers: [{ questionId, selectedOptionId }] }
const completeLesson = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const { answers = [] } = req.body;
  const userId = req.user._id;

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new ApiError(404, "Lesson not found");
  }

  // Idempotent — if already completed, return existing progress
  const existingProgress = await UserLessonProgress.findOne({
    user: userId,
    lesson: lessonId,
  });

  if (existingProgress?.completed) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          alreadyCompleted: true,
          progress: existingProgress,
          xpInfo: null,
        },
        "Lesson already completed"
      )
    );
  }

  // ── Grade the quiz ──────────────────────────────────────────────────────────
  const quiz = lesson.quiz || [];
  let correctCount = 0;

  if (quiz.length > 0 && answers.length > 0) {
    quiz.forEach((question) => {
      const correctOption = (question.options || []).find((o) => o.isCorrect);
      if (!correctOption) return;

      const userAnswer = answers.find(
        (a) => a.questionId === question._id?.toString()
      );
      if (userAnswer?.selectedOptionId === correctOption._id?.toString()) {
        correctCount++;
      }
    });
  }

  const quizScore =
    quiz.length > 0 ? Math.round((correctCount / quiz.length) * 100) : 100;

  // ── Award XP (scaled by quiz score) ────────────────────────────────────────
  const baseXp = lesson.xpReward || 25;
  const xpAwarded = quiz.length > 0 ? Math.round(baseXp * (quizScore / 100)) + Math.round(baseXp * 0.5) : baseXp;
  // Minimum 50% XP for completing; bonus for quiz performance

  const xpResult = await rewardXP(
    userId,
    xpAwarded,
    "lesson_completed",
    "learn",
    `Completed lesson: "${lesson.title}" (Quiz: ${quizScore}%)`
  );

  // ── Save progress ───────────────────────────────────────────────────────────
  let progress;
  if (existingProgress) {
    existingProgress.completed = true;
    existingProgress.quizScore = quizScore;
    existingProgress.xpAwarded = xpAwarded;
    existingProgress.completedAt = new Date();
    await existingProgress.save();
    progress = existingProgress;
  } else {
    progress = await UserLessonProgress.create({
      user: userId,
      lesson: lessonId,
      course: lesson.course,
      completed: true,
      quizScore,
      xpAwarded,
      completedAt: new Date(),
    });
  }

  // ── Check course-level achievements ────────────────────────────────────────
  const completedInCourse = await UserLessonProgress.countDocuments({
    user: userId,
    course: lesson.course,
    completed: true,
  });

  const totalInCourse = await Lesson.countDocuments({ course: lesson.course });

  if (completedInCourse === 1) {
    await checkAndUnlockAchievement(
      userId,
      "first_lesson",
      "First Steps",
      "Completed your first lesson in LifeSync Learn!",
      "BookOpen"
    );
  }

  if (completedInCourse >= totalInCourse) {
    await checkAndUnlockAchievement(
      userId,
      `course_${lesson.course}`,
      "Money Scholar",
      "Completed the Money Basics for Students course!",
      "GraduationCap"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        progress,
        quizResults: {
          score: quizScore,
          correct: correctCount,
          total: quiz.length,
        },
        xpInfo: xpResult
          ? {
              xpAwarded,
              leveledUp: xpResult.leveledUp,
              currentLevel: xpResult.user?.level,
              currentXp: xpResult.user?.xp,
            }
          : null,
      },
      "Lesson completed successfully"
    )
  );
});

export { getCourses, getCourseById, getLessonById, completeLesson };
