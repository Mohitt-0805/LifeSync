import mongoose, { Schema } from "mongoose";

const milestoneSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const goalSchema = new Schema(
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
    category: {
      type: String,
      enum: ["career", "health", "finance", "learning", "relationship", "other"],
      default: "career",
    },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "abandoned"],
      default: "not_started",
      index: true,
    },
    startDate: {
      type: Date,
    },
    targetDate: {
      type: Date,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    milestones: {
      type: [milestoneSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

import { MockGoal, Milestone as MockMilestone } from "../utils/mockDb.js";
export const Goal = process.env.USE_MOCK_DB === "true" ? MockGoal : mongoose.model("Goal", goalSchema);
export const Milestone = process.env.USE_MOCK_DB === "true" ? MockMilestone : mongoose.model("Milestone", milestoneSchema);
