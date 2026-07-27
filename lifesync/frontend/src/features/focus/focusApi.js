import { apiSlice } from "../../store/apiSlice";

export const focusApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    startFocusSession: builder.mutation({
      query: (data) => ({
        url: "/focus/start",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["FocusSession"],
    }),
    completeFocusSession: builder.mutation({
      query: (id) => ({
        url: `/focus/${id}/complete`,
        method: "POST",
      }),
      invalidatesTags: ["FocusSession", "User", "Activity"],
    }),
    getTodayFocusSummary: builder.query({
      query: () => "/focus/today-summary",
      providesTags: ["FocusSession"],
    }),
    getWeekFocusSummary: builder.query({
      query: () => "/focus/week-summary",
      providesTags: ["FocusSession"],
    }),
  }),
});

export const {
  useStartFocusSessionMutation,
  useCompleteFocusSessionMutation,
  useGetTodayFocusSummaryQuery,
  useGetWeekFocusSummaryQuery,
} = focusApi;
