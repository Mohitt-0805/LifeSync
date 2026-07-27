import { Note } from "../models/Note.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create Note
const createNote = asyncHandler(async (req, res) => {
  const { title, content, folder, tags } = req.body;

  const note = await Note.create({
    user: req.user._id,
    title: title || "Untitled",
    content: content || "",
    folder: folder || "General",
    tags: tags || [],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, note, "Note created successfully"));
});

// Get Notes (with Folder, Pin, Tags filters & Search)
const getNotes = asyncHandler(async (req, res) => {
  const { folder, search, tag, isPinned } = req.query;

  const query = { user: req.user._id };

  if (folder) query.folder = folder;
  if (isPinned !== undefined) query.isPinned = isPinned === "true";
  if (tag) query.tags = tag;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }

  // Fetch pinned notes first, then sort by last updated
  const notes = await Note.find(query).sort({ isPinned: -1, updatedAt: -1 });

  // Get distinct folders to feed side navigation lists
  const folders = await Note.distinct("folder", { user: req.user._id });

  return res
    .status(200)
    .json(new ApiResponse(200, { notes, folders }, "Notes retrieved successfully"));
});

// Update Note
const updateNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, folder, tags, isPinned } = req.body;

  const note = await Note.findOne({ _id: id, user: req.user._id });
  if (!note) {
    throw new ApiError(404, "Note not found or access denied");
  }

  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;
  if (folder !== undefined) note.folder = folder;
  if (tags !== undefined) note.tags = tags;
  if (isPinned !== undefined) note.isPinned = isPinned;

  await note.save();

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Note updated successfully"));
});

// Delete Note
const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const note = await Note.findOneAndDelete({ _id: id, user: req.user._id });
  if (!note) {
    throw new ApiError(404, "Note not found or access denied");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Note deleted successfully"));
});

export { createNote, getNotes, updateNote, deleteNote };
