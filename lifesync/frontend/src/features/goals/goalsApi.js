import { apiSlice } from "../../store/apiSlice";

export const goalsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGoals: builder.query({
      query: (params) => ({
        url: "/goals",
        params,
      }),
      providesTags: ["Goal"],
    }),
    createGoal: builder.mutation({
      query: (goalData) => ({
        url: "/goals",
        method: "POST",
        body: goalData,
      }),
      invalidatesTags: ["Goal", "User"],
    }),
    updateGoal: builder.mutation({
      query: ({ id, ...goalData }) => ({
        url: `/goals/${id}`,
        method: "PUT",
        body: goalData,
      }),
      invalidatesTags: ["Goal", "User"],
    }),
    deleteGoal: builder.mutation({
      query: (id) => ({
        url: `/goals/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Goal", "User"],
    }),
  }),
});

export const {
  useGetGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useDeleteGoalMutation,
} = goalsApi;
