import { connectDB } from '../db';
import { Expense, IExpense } from '../models/Expense';
import { Budget } from '../models/Budget';
import { Income } from '../models/Income';
import { Goal } from '../models/Goal';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subMonths, parseISO } from 'date-fns';
import mongoose from 'mongoose';

export interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  search?: string;
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function getExpenses(userId: string, filters: ExpenseFilters = {}) {
  await connectDB();
  
  const query: Record<string, unknown> = { user: new mongoose.Types.ObjectId(userId) };
  
  if (filters.category && filters.category !== 'all') {
    query.category = filters.category;
  }

  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    query.paymentMethod = filters.paymentMethod;
  }
  
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) {
      (query.date as Record<string, Date>).$gte = parseISO(filters.startDate);
    }
    if (filters.endDate) {
      (query.date as Record<string, Date>).$lte = parseISO(filters.endDate);
    }
  }
  
  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    query.amount = {};
    if (filters.minAmount !== undefined) {
      (query.amount as Record<string, number>).$gte = filters.minAmount;
    }
    if (filters.maxAmount !== undefined) {
      (query.amount as Record<string, number>).$lte = filters.maxAmount;
    }
  }
  
  if (filters.search) {
    query.$or = [
      { description: { $regex: filters.search, $options: 'i' } },
      { paymentMethod: { $regex: filters.search, $options: 'i' } }
    ];
  }

  const sortValue = filters.sortOrder === 'asc' ? 1 : -1;
  const sortStage: Record<string, 1|-1> = {};
  if (filters.sortBy === 'amount') {
    sortStage.amount = sortValue;
  } else if (filters.sortBy === 'category') {
    sortStage.category = sortValue;
  } else {
    sortStage.date = sortValue;
  }
  sortStage._id = 1;

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;
  
  const [expenses, total] = await Promise.all([
    Expense.find(query).sort(sortStage).skip(skip).limit(limit),
    Expense.countDocuments(query),
  ]);
  
  return { expenses, total, page, totalPages: Math.ceil(total / limit) };
}

export async function createExpense(userId: string, data: Partial<IExpense>) {
  await connectDB();
  const expense = await Expense.create({ ...data, user: new mongoose.Types.ObjectId(userId) });
  return expense;
}

export async function updateExpense(userId: string, expenseId: string, data: Partial<IExpense>) {
  await connectDB();
  const expense = await Expense.findOneAndUpdate(
    { _id: expenseId, user: new mongoose.Types.ObjectId(userId) },
    data,
    { new: true }
  );
  return expense;
}

export async function deleteExpense(userId: string, expenseId: string) {
  await connectDB();
  const result = await Expense.findOneAndDelete({ _id: expenseId, user: new mongoose.Types.ObjectId(userId) });
  return result;
}

export async function getAnalytics(userId: string, period: 'week' | 'month' | 'year' = 'month') {
  await connectDB();
  
  const now = new Date();
  let startDate: Date;
  let endDate: Date;
  
  switch (period) {
    case 'week':
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
      break;
    case 'year':
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      break;
    default:
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
  }
  
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // ── Category breakdown ─────────────────────────────────────────────────────
  const categoryBreakdown = await Expense.aggregate([
    { $match: { user: userObjectId, date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  const totalSpending = categoryBreakdown.reduce((sum, cat) => sum + cat.total, 0);

  // ── Monthly trend (last 6 months) ──────────────────────────────────────────
  const sixMonthsAgo = subMonths(now, 6);
  const spendingMonthlyTrendRaw = await Expense.aggregate([
    { $match: { user: userObjectId, date: { $gte: sixMonthsAgo } } },
    { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } }
  ]);

  const incomeMonthlyTrendRaw = await Income.aggregate([
    { $match: { user: userObjectId, date: { $gte: sixMonthsAgo } } },
    { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } }
  ]);

  // Combine spending and income trends into a dictionary
  const trendMap = new Map<string, { spending: number; income: number }>();
  
  for (const s of spendingMonthlyTrendRaw) {
    const key = `${s._id.year}-${String(s._id.month).padStart(2, '0')}`;
    trendMap.set(key, { spending: s.total, income: 0 });
  }
  
  for (const i of incomeMonthlyTrendRaw) {
    const key = `${i._id.year}-${String(i._id.month).padStart(2, '0')}`;
    if (trendMap.has(key)) {
      trendMap.get(key)!.income = i.total;
    } else {
      trendMap.set(key, { spending: 0, income: i.total });
    }
  }

  const monthlyTrend = Array.from(trendMap.entries())
    .map(([month, data]) => ({ month, spending: data.spending, income: data.income }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // ── Recent expenses ────────────────────────────────────────────────────────
  const recentExpenses = await Expense.find({ user: userObjectId }).sort({ date: -1 }).limit(5);

  // ── Budget status ──────────────────────────────────────────────────────────
  const budgets = await Budget.find({ user: userObjectId, isActive: true });
  const budgetStatus = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await Expense.aggregate([
        { $match: { user: userObjectId, category: budget.category, date: { $gte: startOfMonth(now), $lte: endOfMonth(now) } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      return {
        category: budget.category,
        budgetAmount: budget.amount,
        spent: spent[0]?.total || 0,
        remaining: budget.amount - (spent[0]?.total || 0),
        percentage: Math.round(((spent[0]?.total || 0) / budget.amount) * 100),
      };
    })
  );

  // ── Previous period spending (for % change) ────────────────────────────────
  const periodMs = endDate.getTime() - startDate.getTime();
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - periodMs);
  const prevResult = await Expense.aggregate([
    { $match: { user: userObjectId, date: { $gte: prevStart, $lte: prevEnd } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const prevPeriodSpending = prevResult[0]?.total || 0;

  // ── Income Analytics ───────────────────────────────────────────────────────
  const incomeResult = await Income.aggregate([
    { $match: { user: userObjectId, date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalIncome = incomeResult[0]?.total || 0;

  const prevIncomeResult = await Income.aggregate([
    { $match: { user: userObjectId, date: { $gte: prevStart, $lte: prevEnd } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const prevPeriodIncome = prevIncomeResult[0]?.total || 0;

  const incomeSourceBreakdown = await Income.aggregate([
    { $match: { user: userObjectId, date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$source', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  const netBalance = totalIncome - totalSpending;

  // ── Payment method breakdown ───────────────────────────────────────────────
  const paymentMethodRaw = await Expense.aggregate([
    { $match: { user: userObjectId, date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  // ── Spending by day of week (MongoDB $dayOfWeek: 1=Sun … 7=Sat) ───────────
  const weekdayRaw = await Expense.aggregate([
    { $match: { user: userObjectId, date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: { $dayOfWeek: '$date' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayPattern = DAY_NAMES.map((day, idx) => {
    const found = weekdayRaw.find((d) => d._id === idx + 1);
    return { day, total: found?.total || 0, count: found?.count || 0 };
  });

  // ── Top 5 largest transactions in period ───────────────────────────────────
  const topExpenses = await Expense.find({ user: userObjectId, date: { $gte: startDate, $lte: endDate } })
    .sort({ amount: -1 })
    .limit(5)
    .lean();

  // ── KPI helpers ────────────────────────────────────────────────────────────
  const txCount = categoryBreakdown.reduce((s, c) => s + c.count, 0);
  const avgPerTransaction = txCount > 0 ? totalSpending / txCount : 0;
  const dayCount = Math.max(1, Math.round(periodMs / 86400000));
  const dailyAverage = totalSpending / dayCount;

  // ── Top Active Goal ────────────────────────────────────────────────────────
  const topGoal = await Goal.findOne({ user: userObjectId, status: 'active' }).sort({ targetAmount: -1 }).lean();

  return {
    totalSpending,
    prevPeriodSpending,
    totalIncome,
    prevPeriodIncome,
    netBalance,
    avgPerTransaction,
    dailyAverage,
    categoryBreakdown: categoryBreakdown.map(cat => ({
      category: cat._id,
      total: cat.total,
      count: cat.count,
      percentage: Math.round((cat.total / totalSpending) * 100) || 0,
    })),
    incomeSourceBreakdown: incomeSourceBreakdown.map(src => ({
      source: src._id,
      total: src.total,
      count: src.count,
      percentage: Math.round((src.total / totalIncome) * 100) || 0,
    })),
    monthlyTrend,
    paymentMethodBreakdown: paymentMethodRaw.map(p => ({
      method: p._id,
      total: p.total,
      count: p.count,
      percentage: Math.round((p.total / totalSpending) * 100) || 0,
    })),
    weekdayPattern,
    topExpenses,
    recentExpenses,
    budgetStatus,
    period,
    topGoal: topGoal ? {
      title: topGoal.title,
      targetAmount: topGoal.targetAmount,
      currentAmount: topGoal.currentAmount,
      color: topGoal.color,
      icon: topGoal.icon
    } : null
  };
}

export async function exportToCSV(userId: string, filters: ExpenseFilters = {}) {
  const { expenses } = await getExpenses(userId, { ...filters, limit: 10000 });
  
  const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method', 'Notes'];
  const rows = expenses.map(exp => [
    exp.date.toISOString().split('T')[0],
    exp.description,
    exp.category,
    exp.amount.toString(),
    exp.paymentMethod,
    exp.notes || '',
  ]);
  
  const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  return csv;
}
