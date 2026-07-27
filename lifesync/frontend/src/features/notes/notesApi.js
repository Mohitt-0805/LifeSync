import { apiSlice } from "../../store/apiSlice";

export const notesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotes: builder.query({
      query: (params) => ({
        url: "/notes",
        params,
      }),
      providesTags: ["Note"],
    }),
    createNote: builder.mutation({
      query: (noteData) => ({
        url: "/notes",
        method: "POST",
        body: noteData,
      }),
      invalidatesTags: ["Note"],
    }),
    updateNote: builder.mutation({
      query: ({ id, ...noteData }) => ({
        url: `/notes/${id}`,
        method: "PUT",
        body: noteData,
      }),
      invalidatesTags: ["Note"],
    }),
    deleteNote: builder.mutation({
      query: (id) => ({
        url: `/notes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Note"],
    }),
  }),
});

export const {
  useGetNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = notesApi;
