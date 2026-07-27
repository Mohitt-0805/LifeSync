import { apiSlice } from "../../store/apiSlice";

export const habitsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHabits: builder.query({
      query: () => "/habits",
      providesTags: ["Habit"],
    }),
    createHabit: builder.mutation({
      query: (habitData) => ({
        url: "/habits",
        method: "POST",
        body: habitData,
      }),
      invalidatesTags: ["Habit", "User"],
    }),
    toggleHabit: builder.mutation({
      query: ({ id, date }) => ({
        url: `/habits/${id}/toggle`,
        method: "POST",
        body: { date },
      }),
      invalidatesTags: ["Habit", "User"],
    }),
    deleteHabit: builder.mutation({
      query: (id) => ({
        url: `/habits/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Habit"],
    }),
  }),
});

export const {
  useGetHabitsQuery,
  useCreateHabitMutation,
  useToggleHabitMutation,
  useDeleteHabitMutation,
} = habitsApi;
