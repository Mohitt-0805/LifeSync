import { apiSlice } from "../../store/apiSlice";

export const expensesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExpenses: builder.query({
      query: (params) => ({
        url: "/expenses",
        params,
      }),
      providesTags: ["Expense"],
    }),
    getExpenseStats: builder.query({
      query: () => "/expenses/stats",
      providesTags: ["Expense"],
    }),
    createExpense: builder.mutation({
      query: (expenseData) => ({
        url: "/expenses",
        method: "POST",
        body: expenseData,
      }),
      invalidatesTags: ["Expense"],
    }),
    createBudget: builder.mutation({
      query: (budgetData) => ({
        url: "/expenses/budgets",
        method: "POST",
        body: budgetData,
      }),
      invalidatesTags: ["Expense"],
    }),
    getBudgets: builder.query({
      query: () => "/expenses/budgets",
      providesTags: ["Expense"],
    }),
    deleteExpense: builder.mutation({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Expense"],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseStatsQuery,
  useCreateExpenseMutation,
  useCreateBudgetMutation,
  useGetBudgetsQuery,
  useDeleteExpenseMutation,
} = expensesApi;
