import { ClassSchedule } from "../models/ClassSchedule.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES_JS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// GET /api/v1/classes
export const getClasses = asyncHandler(async (req, res) => {
  const classes = await ClassSchedule.find({ user: req.user._id });

  // Sort by dayOfWeek order then startTime
  classes.sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
    if (dayDiff !== 0) return dayDiff;
    return (a.startTime || "").localeCompare(b.startTime || "");
  });

  return res
    .status(200)
    .json(new ApiResponse(200, classes, "Class schedules retrieved successfully"));
});

// POST /api/v1/classes
export const createClass = asyncHandler(async (req, res) => {
  const { subjectName, dayOfWeek, startTime, endTime, room, color, recurring } = req.body;

  if (!subjectName || !dayOfWeek || !startTime || !endTime) {
    throw new ApiError(400, "Subject name, day of week, start time and end time are required");
  }

  const newClass = await ClassSchedule.create({
    user: req.user._id,
    subjectName,
    dayOfWeek,
    startTime,
    endTime,
    room: room || "",
    color: color || "#3b6cff",
    recurring: recurring !== undefined ? recurring : true,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newClass, "Class schedule created successfully"));
});

// PUT /api/v1/classes/:id
export const updateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subjectName, dayOfWeek, startTime, endTime, room, color, recurring } = req.body;

  const item = await ClassSchedule.findOne({ _id: id, user: req.user._id });
  if (!item) {
    throw new ApiError(404, "Class schedule not found");
  }

  if (subjectName !== undefined) item.subjectName = subjectName;
  if (dayOfWeek !== undefined) item.dayOfWeek = dayOfWeek;
  if (startTime !== undefined) item.startTime = startTime;
  if (endTime !== undefined) item.endTime = endTime;
  if (room !== undefined) item.room = room;
  if (color !== undefined) item.color = color;
  if (recurring !== undefined) item.recurring = recurring;

  await item.save();

  return res
    .status(200)
    .json(new ApiResponse(200, item, "Class schedule updated successfully"));
});

// DELETE /api/v1/classes/:id
export const deleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const item = await ClassSchedule.findOneAndDelete({ _id: id, user: req.user._id });
  if (!item) {
    throw new ApiError(404, "Class schedule not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Class schedule deleted successfully"));
});

// GET /api/v1/classes/next
export const getNextClass = asyncHandler(async (req, res) => {
  const allClasses = await ClassSchedule.find({ user: req.user._id });

  if (allClasses.length === 0) {
    return res.status(200).json(
      new ApiResponse(
        200,
        { nextClass: null, classesToday: [], isToday: true },
        "No class schedules found"
      )
    );
  }

  const now = new Date();
  const todayDayStr = DAY_NAMES_JS[now.getDay()]; // e.g. "Mon"
  const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Filter classes scheduled for today
  const classesToday = allClasses.filter((c) => c.dayOfWeek === todayDayStr);
  classesToday.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

  // Next class today (whose end time > current time)
  const remainingToday = classesToday.filter((c) => (c.endTime || c.startTime) >= currentHHMM);

  if (remainingToday.length > 0) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          nextClass: remainingToday[0],
          classesToday: remainingToday,
          isToday: true,
          dayOfWeek: todayDayStr,
        },
        "Next class retrieved successfully"
      )
    );
  }

  // If none left today, find next upcoming day with classes
  const currentJsDayIdx = now.getDay(); // 0 for Sun
  for (let offset = 1; offset <= 7; offset++) {
    const nextDayIdx = (currentJsDayIdx + offset) % 7;
    const nextDayStr = DAY_NAMES_JS[nextDayIdx];
    const dayClasses = allClasses.filter((c) => c.dayOfWeek === nextDayStr);
    if (dayClasses.length > 0) {
      dayClasses.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            nextClass: dayClasses[0],
            classesToday: dayClasses,
            isToday: false,
            dayOfWeek: nextDayStr,
          },
          "Next class retrieved successfully"
        )
      );
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { nextClass: null, classesToday: [], isToday: false },
      "No upcoming classes"
    )
  );
});
