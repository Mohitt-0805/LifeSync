import React, { useState } from "react";
import {
  useGetExpensesQuery,
  useGetExpenseStatsQuery,
  useCreateExpenseMutation,
  useCreateBudgetMutation,
  useDeleteExpenseMutation,
} from "./expensesApi";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Dropdown } from "../../components/ui/Dropdown";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";

export default function Expenses() {
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Form states
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [formError, setFormError] = useState("");

  // Budget states
  const [budgetCategory, setBudgetCategory] = useState("food");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetError, setBudgetError] = useState("");

  // Queries & Mutations
  const { data: txRes, isLoading: txLoading } = useGetExpensesQuery({ limit: 10 });
  const { data: statsRes, isLoading: statsLoading } = useGetExpenseStatsQuery();

  const [createTx, { isLoading: txCreating }] = useCreateExpenseMutation();
  const [createBudget, { isLoading: budgetSetting }] = useCreateBudgetMutation();
  const [deleteTx] = useDeleteExpenseMutation();

  const handleCreateTx = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!amount || parseFloat(amount) <= 0) {
      setFormError("Valid positive amount is required");
      return;
    }

    try {
      await createTx({
        amount: parseFloat(amount),
        type,
        category,
        description,
        date: date ? new Date(date) : undefined,
      }).unwrap();

      setAmount("");
      setDescription("");
      setDate("");
      setIsTxModalOpen(false);
    } catch (err) {
      setFormError(err?.data?.message || "Failed to log transaction");
    }
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    setBudgetError("");

    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      setBudgetError("Valid positive budget amount is required");
      return;
    }

    try {
      await createBudget({
        category: budgetCategory,
        amount: parseFloat(budgetAmount),
        period: "monthly",
      }).unwrap();

      setBudgetAmount("");
      setIsBudgetModalOpen(false);
    } catch (err) {
      setBudgetError(err?.data?.message || "Failed to set budget limit");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTx(id).unwrap();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Setup Pie Chart Candy Colors
  const COLORS = ["#FF5A36", "#8B5CF6", "#10B981", "#F59E0B", "#14B8A6", "#6366F1", "#EC4899"];

  const transactions = txRes?.data?.transactions || [];
  const stats = statsRes?.data || { totals: { income: 0, expense: 0, balance: 0 }, categoryStats: [], budgetWarnings: [] };

  // Prepare monthly trend data for Recharts Bar Chart
  const trendData = stats.monthlyTrend?.reduce((acc, curr) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const label = `${monthNames[curr._id.month - 1]} ${curr._id.year}`;
    
    let existing = acc.find((d) => d.name === label);
    if (!existing) {
      existing = { name: label, Income: 0, Expense: 0 };
      acc.push(existing);
    }
    
    if (curr._id.type === "income") existing.Income = curr.total;
    if (curr._id.type === "expense") existing.Expense = curr.total;
    
    return acc;
  }, []) || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-heading font-bold text-candy-expenses">Expense Tracker</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Log transactions, track category allocations, and stay within budgets
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBudgetModalOpen(true)}>
            Set Budget limit
          </Button>
          <Button onClick={() => setIsTxModalOpen(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Log Transaction
          </Button>
        </div>
      </div>

      {/* Budget warnings */}
      {stats.budgetWarnings?.length > 0 && (
        <div className="space-y-2">
          {stats.budgetWarnings.map((warning, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-4 bg-red-100 border-2 border-red-500 text-red-800 rounded-3xl font-heading font-bold text-sm shadow-retro-sm"
            >
              <AlertTriangle className="text-red-600 animate-bounce" size={20} />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card hoverable={false} className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-black p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-heading font-bold text-gray-500 uppercase">Total Income</div>
            <div className="text-2xl font-heading font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(stats.totals?.income || 0)}
            </div>
          </div>
          <div className="p-3 bg-emerald-500 text-white rounded-2xl border-2 border-black shadow-retro-sm">
            <ArrowUpRight size={24} />
          </div>
        </Card>

        <Card hoverable={false} className="bg-red-50 dark:bg-red-950/20 border-2 border-black p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-heading font-bold text-gray-500 uppercase">Total Expenses</div>
            <div className="text-2xl font-heading font-bold text-red-600 dark:text-red-400 mt-1">
              {formatCurrency(stats.totals?.expense || 0)}
            </div>
          </div>
          <div className="p-3 bg-red-500 text-white rounded-2xl border-2 border-black shadow-retro-sm">
            <ArrowDownRight size={24} />
          </div>
        </Card>

        <Card hoverable={false} className="bg-blue-50 dark:bg-blue-950/20 border-2 border-black p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-heading font-bold text-gray-500 uppercase">Net Balance</div>
            <div className="text-2xl font-heading font-bold text-blue-600 dark:text-blue-400 mt-1">
              {formatCurrency(stats.totals?.balance || 0)}
            </div>
          </div>
          <div className="p-3 bg-blue-500 text-white rounded-2xl border-2 border-black shadow-retro-sm">
            <Wallet size={24} />
          </div>
        </Card>
      </div>

      {/* Visualizations Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown (Pie Chart) */}
        <Card hoverable={false} className="p-6 flex flex-col justify-between">
          <h2 className="text-xl font-heading font-bold mb-4 border-b-2 border-black dark:border-white pb-2">
            Expense Allocation
          </h2>
          {statsLoading || stats.categoryStats?.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 italic">
              {statsLoading ? "Loading breakdown data..." : "No expense logs for breakdown."}
            </div>
          ) : (
            <div className="h-64 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryStats}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {stats.categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#000" strokeWidth={1.5} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends list */}
              <div className="w-full sm:w-1/2 flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                {stats.categoryStats.map((item, idx) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md border border-black" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="capitalize font-medium">{item.category}</span>
                    </span>
                    <span className="font-heading font-bold">{formatCurrency(item.total || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Monthly Trend (Bar Chart) */}
        <Card hoverable={false} className="p-6 flex flex-col justify-between">
          <h2 className="text-xl font-heading font-bold mb-4 border-b-2 border-black dark:border-white pb-2">
            Monthly Trend
          </h2>
          {statsLoading || trendData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 italic">
              {statsLoading ? "Loading trend chart..." : "No trend data logged."}
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <XAxis dataKey="name" stroke="#888" tickLine={false} style={{ fontSize: 10, fontWeight: "bold" }} />
                  <YAxis stroke="#888" tickLine={false} style={{ fontSize: 10, fontWeight: "bold" }} tickFormatter={(value) => formatCurrency(value, { compact: true })} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: "bold" }} />
                  <Bar dataKey="Income" fill="#10B981" stroke="#000" strokeWidth={1} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#FF5A36" stroke="#000" strokeWidth={1} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Transactions Table List */}
      <Card hoverable={false} className="p-6">
        <h2 className="text-xl font-heading font-bold mb-4 border-b-2 border-black dark:border-white pb-2">
          Recent Transactions
        </h2>

        {txLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10" variant="text" />
            <Skeleton className="h-10" variant="text" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-6 text-gray-400 italic text-sm">
            No transactions logged yet. Add one above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black dark:border-white text-xs font-heading font-bold text-gray-500 uppercase">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10 text-sm">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-cream-dark/30 dark:hover:bg-navy-850/40">
                    <td className="py-3.5">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="py-3.5">
                      <Badge variant={tx.type === "income" ? "success" : "expenses"}>
                        {tx.category}
                      </Badge>
                    </td>
                    <td className="py-3.5 max-w-xs truncate">{tx.description || "—"}</td>
                    <td className="py-3.5 font-heading font-bold capitalize">
                      <span className={tx.type === "income" ? "text-emerald-500" : "text-brand"}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-heading font-bold">
                      <span className={tx.type === "income" ? "text-emerald-500" : "text-brand"}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount || 0)}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => handleDelete(tx._id)}
                        className="p-1.5 border border-black dark:border-white rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Transaction Modal */}
      <Modal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} title="Log Transaction">
        <form onSubmit={handleCreateTx} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-100 border-2 border-black text-red-700 rounded-xl font-heading text-sm font-bold text-center">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              label="Transaction Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { label: "Expense (Debit)", value: "expense" },
                { label: "Income (Credit)", value: "income" },
              ]}
            />
            <Input
              label="Amount (₹) *"
              type="number"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={
                type === "income"
                  ? [
                      { label: "Salary", value: "salary" },
                      { label: "Freelance", value: "freelance" },
                      { label: "Investments", value: "investments" },
                      { label: "Other", value: "other" },
                    ]
                  : [
                      { label: "Food & Drinks", value: "food" },
                      { label: "Rent & Utilities", value: "rent" },
                      { label: "Entertainment", value: "entertainment" },
                      { label: "Shopping", value: "shopping" },
                      { label: "Transportation", value: "transportation" },
                      { label: "Healthcare", value: "healthcare" },
                      { label: "Other", value: "other" },
                    ]
              }
            />
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <Input
            label="Description / Vendor"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Swiggy food delivery, Freelance stipend"
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setIsTxModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={txCreating}>
              Log Transaction
            </Button>
          </div>
        </form>
      </Modal>

      {/* Budget Limit Modal */}
      <Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title="Set Budget Limits">
        <form onSubmit={handleSetBudget} className="space-y-4">
          {budgetError && (
            <div className="p-3 bg-red-100 border-2 border-black text-red-700 rounded-xl font-heading text-sm font-bold text-center">
              {budgetError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Dropdown
              label="Category Target"
              value={budgetCategory}
              onChange={(e) => setBudgetCategory(e.target.value)}
              options={[
                { label: "All Spending (Overall Cap)", value: "all" },
                { label: "Food & Drinks", value: "food" },
                { label: "Rent & Utilities", value: "rent" },
                { label: "Entertainment", value: "entertainment" },
                { label: "Shopping", value: "shopping" },
                { label: "Transportation", value: "transportation" },
                { label: "Healthcare", value: "healthcare" },
                { label: "Other", value: "other" },
              ]}
            />
            <Input
              label="Monthly Limit (₹) *"
              type="number"
              step="1"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="e.g. 15000"
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setIsBudgetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={budgetSetting}>
              Set Budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
