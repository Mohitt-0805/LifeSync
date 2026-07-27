import mongoose, { Schema } from "mongoose";

const achievementSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    badgeCode: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

import { MockAchievement } from "../utils/mockDb.js";
export const Achievement = process.env.USE_MOCK_DB === "true" ? MockAchievement : mongoose.model("Achievement", achievementSchema);
