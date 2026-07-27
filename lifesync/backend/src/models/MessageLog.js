import mongoose, { Schema } from "mongoose";

const messageLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["task_due", "goal_deadline", "event_reminder", "membership_renewal", "other"],
      required: true,
      index: true,
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    relatedEntityType: {
      type: String,
      enum: ["Task", "Goal", "Event", "Membership", "Other"],
      default: "Other",
    },
    recipient: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "failed", "queued"],
      default: "sent",
      index: true,
    },
    error: {
      type: String,
      default: "",
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

import { MockMessageLog } from "../utils/mockDb.js";
export const MessageLog =
  process.env.USE_MOCK_DB === "true"
    ? MockMessageLog
    : mongoose.model("MessageLog", messageLogSchema);
