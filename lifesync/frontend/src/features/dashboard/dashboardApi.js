import { apiSlice } from "../../store/apiSlice";

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getActivities: builder.query({
      query: () => "/activities",
      providesTags: ["User"],
    }),
    getAchievements: builder.query({
      query: () => "/achievements",
      providesTags: ["Achievement"],
    }),
    getNotifications: builder.query({
      query: () => "/notifications",
      providesTags: ["Notification"],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: "/notifications",
        method: "PUT",
      }),
      invalidatesTags: ["Notification"],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["Notification"],
    }),
    globalSearch: builder.query({
      query: (q) => ({
        url: "/search",
        params: { q },
      }),
    }),
  }),
});

export const {
  useGetActivitiesQuery,
  useGetAchievementsQuery,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useGlobalSearchQuery,
} = dashboardApi;
