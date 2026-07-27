import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema(
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
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
    reminders: {
      type: [Date],
      default: [],
    },
    category: {
      type: String,
      default: "general",
    },
  },
  {
    timestamps: true,
  }
);

import { MockEvent } from "../utils/mockDb.js";
export const Event = process.env.USE_MOCK_DB === "true" ? MockEvent : mongoose.model("Event", eventSchema);
