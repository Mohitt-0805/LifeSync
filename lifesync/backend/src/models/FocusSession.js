import mongoose, { Schema } from "mongoose";
import { MockFocusSession } from "../utils/mockDb.js";

const focusSessionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    linkedTaskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
  },
  {
    timestamps: true,
  }
);

export const FocusSession =
  process.env.USE_MOCK_DB === "true"
    ? MockFocusSession
    : mongoose.model("FocusSession", focusSessionSchema);
