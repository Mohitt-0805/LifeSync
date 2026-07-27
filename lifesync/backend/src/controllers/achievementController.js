import { Achievement } from "../models/Achievement.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Fetch user achievements/badges
const getAchievements = asyncHandler(async (req, res) => {
  const achievements = await Achievement.find({ user: req.user._id })
    .sort({ unlockedAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, achievements, "Achievements unlocked log retrieved successfully"));
});

export { getAchievements };
