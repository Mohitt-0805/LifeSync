import { Task } from "../models/Task.js";
import { Goal } from "../models/Goal.js";
import { Note } from "../models/Note.js";
import { Event } from "../models/Event.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Global search query
const globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res
      .status(200)
      .json(new ApiResponse(200, { tasks: [], goals: [], notes: [], events: [] }, "Empty query"));
  }

  const regex = new RegExp(q, "i");

  // Query in parallel
  const [tasks, goals, notes, events] = await Promise.all([
    Task.find({ user: req.user._id, $or: [{ title: regex }, { description: regex }] }).limit(5),
    Goal.find({ user: req.user._id, $or: [{ title: regex }, { description: regex }] }).limit(5),
    Note.find({ user: req.user._id, $or: [{ title: regex }, { content: regex }] }).limit(5),
    Event.find({ user: req.user._id, $or: [{ title: regex }, { description: regex }] }).limit(5),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        tasks,
        goals,
        notes,
        events,
      },
      "Global search completed successfully"
    )
  );
});

export { globalSearch };
