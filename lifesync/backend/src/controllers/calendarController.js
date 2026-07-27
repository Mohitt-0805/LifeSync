import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getUnifiedCalendarItems } from "../services/calendar.service.js";

/**
 * GET /api/v1/calendar or GET /api/calendar
 * Returns a unified read view array combining Tasks, Events, Goals, and Memberships.
 */
export const getUnifiedCalendar = asyncHandler(async (req, res) => {
  const { month, year, startDate, endDate, include } = req.query;

  const items = await getUnifiedCalendarItems({
    userId: req.user._id,
    month,
    year,
    startDate,
    endDate,
    include,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      items,
      "Unified calendar items retrieved successfully"
    )
  );
});
