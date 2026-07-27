import mongoose, { Schema } from "mongoose";
import { MockCourse } from "../utils/mockDb.js";

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      default: "finance",
      trim: true,
    },
    coverEmoji: {
      type: String,
      default: "📚",
    },
    accentColor: {
      type: String,
      default: "#8B5CF6",
    },
    order: {
      type: Number,
      default: 0,
    },
    totalLessons: {
      type: Number,
      default: 0,
    },
    totalXp: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Course =
  process.env.USE_MOCK_DB === "true"
    ? MockCourse
    : mongoose.model("Course", courseSchema);
