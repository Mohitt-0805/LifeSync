import { apiSlice } from "../../store/apiSlice";

export const timetableApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getClasses: builder.query({
      query: () => "/classes",
      providesTags: ["ClassSchedule"],
    }),
    getNextClass: builder.query({
      query: () => "/classes/next",
      providesTags: ["ClassSchedule"],
    }),
    addClass: builder.mutation({
      query: (classData) => ({
        url: "/classes",
        method: "POST",
        body: classData,
      }),
      invalidatesTags: ["ClassSchedule"],
    }),
    updateClass: builder.mutation({
      query: ({ id, ...classData }) => ({
        url: `/classes/${id}`,
        method: "PUT",
        body: classData,
      }),
      invalidatesTags: ["ClassSchedule"],
    }),
    deleteClass: builder.mutation({
      query: (id) => ({
        url: `/classes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ClassSchedule"],
    }),
  }),
});

export const {
  useGetClassesQuery,
  useGetNextClassQuery,
  useAddClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
} = timetableApi;
