import mongoose, { Schema } from "mongoose";

const habitSchema = new Schema(
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
    frequency: {
      type: String,
      enum: ["daily", "weekly"],
      default: "daily",
    },
    targetDays: {
      type: Number,
      default: 1,
    },
    streak: {
      type: Number,
      default: 0,
    },
    bestStreak: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

import { MockHabit } from "../utils/mockDb.js";
export const Habit = process.env.USE_MOCK_DB === "true" ? MockHabit : mongoose.model("Habit", habitSchema);
