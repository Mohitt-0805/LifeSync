import mongoose, { Schema } from "mongoose";

const habitLogSchema = new Schema(
  {
    habit: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["completed", "skipped"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of habit completion per date
habitLogSchema.index({ habit: 1, date: 1 }, { unique: true });

import { MockHabitLog } from "../utils/mockDb.js";
export const HabitLog = process.env.USE_MOCK_DB === "true" ? MockHabitLog : mongoose.model("HabitLog", habitLogSchema);
