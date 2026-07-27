import mongoose, { Schema } from "mongoose";

const activitySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      enum: ["tasks", "goals", "habits", "expenses", "notes", "calendar", "achievements"],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

import { MockActivity } from "../utils/mockDb.js";
export const Activity = process.env.USE_MOCK_DB === "true" ? MockActivity : mongoose.model("Activity", activitySchema);
