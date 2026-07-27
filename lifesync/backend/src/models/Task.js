import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    category: {
      type: String,
      enum: ["work", "personal", "health", "finance", "other"],
      default: "personal",
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

import { MockTask } from "../utils/mockDb.js";
export const Task = process.env.USE_MOCK_DB === "true" ? MockTask : mongoose.model("Task", taskSchema);
