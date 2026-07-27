import mongoose, { Schema } from "mongoose";
import { MockUserLessonProgress } from "../utils/mockDb.js";

const userLessonProgressSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    quizScore: {
      // 0-100 percentage score
      type: Number,
      default: null,
    },
    xpAwarded: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index: one progress record per user per lesson
userLessonProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });

export const UserLessonProgress =
  process.env.USE_MOCK_DB === "true"
    ? MockUserLessonProgress
    : mongoose.model("UserLessonProgress", userLessonProgressSchema);
