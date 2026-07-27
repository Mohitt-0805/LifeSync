import mongoose, { Schema } from "mongoose";
import { MockLesson } from "../utils/mockDb.js";

const quizOptionSchema = new Schema(
  {
    label: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true }
);

const quizQuestionSchema = new Schema(
  {
    question: { type: String, required: true },
    options: [quizOptionSchema],
    explanation: { type: String, default: "" },
  },
  { _id: true }
);

const lessonSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      // Full markdown/rich text content for the lesson
      type: String,
      default: "",
    },
    estimatedReadTime: {
      // In minutes
      type: Number,
      default: 5,
    },
    quiz: [quizQuestionSchema],
    xpReward: {
      type: Number,
      default: 25,
    },
  },
  { timestamps: true }
);

export const Lesson =
  process.env.USE_MOCK_DB === "true"
    ? MockLesson
    : mongoose.model("Lesson", lessonSchema);
