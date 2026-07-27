import { Event } from "../models/Event.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create Event
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, isAllDay, category, reminders } = req.body;

  if (!title || !startDate || !endDate) {
    throw new ApiError(400, "Title, start date, and end date are required");
  }

  if (new Date(startDate) > new Date(endDate)) {
    throw new ApiError(400, "Start date must be prior to end date");
  }

  const event = await Event.create({
    user: req.user._id,
    title,
    description,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    isAllDay: !!isAllDay,
    category: category || "general",
    reminders: reminders || [],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, event, "Event scheduled successfully"));
});

// Get Events (with range filters)
const getEvents = asyncHandler(async (req, res) => {
  const { start, end, category } = req.query;

  const query = { user: req.user._id };

  // Allow fetching events within a specific calendar month/date window
  if (start || end) {
    query.startDate = {};
    if (start) query.startDate.$gte = new Date(start);
    if (end) query.startDate.$lte = new Date(end);
  }

  if (category) query.category = category;

  const events = await Event.find(query).sort({ startDate: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, events, "Events retrieved successfully"));
});

// Update Event
const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, startDate, endDate, isAllDay, category, reminders } = req.body;

  const event = await Event.findOne({ _id: id, user: req.user._id });
  if (!event) {
    throw new ApiError(404, "Event not found or access denied");
  }

  if (title !== undefined) event.title = title;
  if (description !== undefined) event.description = description;
  if (isAllDay !== undefined) event.isAllDay = isAllDay;
  if (category !== undefined) event.category = category;
  if (reminders !== undefined) event.reminders = reminders;

  if (startDate !== undefined) event.startDate = new Date(startDate);
  if (endDate !== undefined) event.endDate = new Date(endDate);

  if (event.startDate > event.endDate) {
    throw new ApiError(400, "Start date must be prior to end date");
  }

  await event.save();

  return res
    .status(200)
    .json(new ApiResponse(200, event, "Event updated successfully"));
});

// Delete Event
const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const event = await Event.findOneAndDelete({ _id: id, user: req.user._id });
  if (!event) {
    throw new ApiError(404, "Event not found or access denied");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Event deleted successfully"));
});

export { createEvent, getEvents, updateEvent, deleteEvent };
