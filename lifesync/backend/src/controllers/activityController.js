import { Activity } from "../models/Activity.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Fetch user timeline activities
const getActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);

  return res
    .status(200)
    .json(new ApiResponse(200, activities, "Activity logs timeline retrieved successfully"));
});

export { getActivities };
