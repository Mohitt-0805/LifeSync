import mongoose, { Schema } from "mongoose";

const noteSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Untitled",
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    folder: {
      type: String,
      default: "General",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

import { MockNote } from "../utils/mockDb.js";
export const Note = process.env.USE_MOCK_DB === "true" ? MockNote : mongoose.model("Note", noteSchema);
