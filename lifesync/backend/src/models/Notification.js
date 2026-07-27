import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
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
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["achievement", "reminder", "system"],
      default: "system",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

import { MockNotification } from "../utils/mockDb.js";
export const Notification = process.env.USE_MOCK_DB === "true" ? MockNotification : mongoose.model("Notification", notificationSchema);
