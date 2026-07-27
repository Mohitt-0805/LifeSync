import mongoose, { Schema } from "mongoose";

const budgetSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    period: {
      type: String,
      enum: ["weekly", "monthly"],
      default: "monthly",
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

import { MockBudget } from "../utils/mockDb.js";
export const Budget = process.env.USE_MOCK_DB === "true" ? MockBudget : mongoose.model("Budget", budgetSchema);
