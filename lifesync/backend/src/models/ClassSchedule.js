import mongoose, { Schema } from "mongoose";
import { MockClassSchedule } from "../utils/mockDb.js";

const classScheduleSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    dayOfWeek: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true, // "09:00"
    },
    endTime: {
      type: String,
      required: true, // "10:00"
    },
    room: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      default: "#3b6cff",
    },
    recurring: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ClassSchedule =
  process.env.USE_MOCK_DB === "true"
    ? MockClassSchedule
    : mongoose.model("ClassSchedule", classScheduleSchema);
