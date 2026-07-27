import { apiSlice } from "../../store/apiSlice";

export const learnApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET all published courses with user progress
    getCourses: builder.query({
      query: () => "/courses",
      providesTags: ["Course"],
    }),

    // GET single course with lessons and per-lesson progress
    getCourseById: builder.query({
      query: (courseId) => `/courses/${courseId}`,
      providesTags: (result, error, courseId) => [
        { type: "Course", id: courseId },
      ],
    }),

    // GET single lesson with full content
    getLessonById: builder.query({
      query: (lessonId) => `/lessons/${lessonId}`,
      providesTags: (result, error, lessonId) => [
        { type: "Lesson", id: lessonId },
      ],
    }),

    // POST complete lesson with quiz answers
    completeLesson: builder.mutation({
      query: ({ lessonId, answers }) => ({
        url: `/lessons/${lessonId}/complete`,
        method: "POST",
        body: { answers },
      }),
      invalidatesTags: ["Course", "User"],
    }),
  }),
});

export const {
  useGetCoursesQuery,
  useGetCourseByIdQuery,
  useGetLessonByIdQuery,
  useCompleteLessonMutation,
} = learnApi;
