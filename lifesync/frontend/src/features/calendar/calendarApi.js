import { apiSlice } from "../../store/apiSlice";

export const calendarApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEvents: builder.query({
      query: (params) => ({
        url: "/events",
        params,
      }),
      providesTags: ["Event"],
    }),
    getUnifiedCalendar: builder.query({
      query: (params) => ({
        url: "/calendar",
        params,
      }),
      providesTags: ["Event", "Task", "Goal", "Expense"],
    }),
    createEvent: builder.mutation({
      query: (eventData) => ({
        url: "/events",
        method: "POST",
        body: eventData,
      }),
      invalidatesTags: ["Event"],
    }),
    updateEvent: builder.mutation({
      query: ({ id, ...eventData }) => ({
        url: `/events/${id}`,
        method: "PUT",
        body: eventData,
      }),
      invalidatesTags: ["Event"],
    }),
    deleteEvent: builder.mutation({
      query: (id) => ({
        url: `/events/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Event"],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useGetUnifiedCalendarQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} = calendarApi;
