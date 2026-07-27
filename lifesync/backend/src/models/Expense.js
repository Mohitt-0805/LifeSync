import { SupabaseModel } from "./SupabaseModel.js";

class ExpenseModel extends SupabaseModel {
  constructor() {
    super("expenses", "expenses");
  }

  async aggregate(pipeline = []) {
    const allExpenses = await this.find({});

    const expenses = allExpenses.filter((e) => e.type === "expense");
    const incomes = allExpenses.filter((e) => e.type === "income");

    const groupStage = pipeline.find((s) => s.$group)?.$group;
    if (!groupStage) return [];

    const idField = groupStage._id;

    if (idField && typeof idField === "object" && idField.year && idField.month) {
      const trend = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const year = d.getFullYear(), month = d.getMonth() + 1;
        const byMonth = (arr) =>
          arr.filter((e) => {
            const dt = new Date(e.date);
            return dt.getFullYear() === year && dt.getMonth() + 1 === month;
          }).reduce((s, e) => s + Number(e.amount || 0), 0);
        const inc = byMonth(incomes);
        const exp = byMonth(expenses);
        if (inc > 0) trend.push({ _id: { year, month, type: "income" }, total: inc });
        if (exp > 0) trend.push({ _id: { year, month, type: "expense" }, total: exp });
      }
      return trend;
    }

    if (idField === "$category") {
      const catMap = {};
      expenses.forEach((e) => {
        catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount || 0);
      });
      return Object.keys(catMap).map((cat) =>
        groupStage.spent
          ? { _id: cat, spent: catMap[cat] }
          : { category: cat, total: catMap[cat] }
      );
    }

    if (idField === "$type") {
      return [
        { type: "income", total: incomes.reduce((s, e) => s + Number(e.amount || 0), 0) },
        { type: "expense", total: expenses.reduce((s, e) => s + Number(e.amount || 0), 0) },
      ];
    }

    return [];
  }
}

export const Expense = new ExpenseModel();
