import { connectDB } from '../db';
import { Expense, IExpense } from '../models/Expense';
import { Budget } from '../models/Budget';
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
  // Stable sort tie-breaker
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
  
  const expense = await Expense.create({
    ...data,
    user: new mongoose.Types.ObjectId(userId),
  });
  
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
  
  const result = await Expense.findOneAndDelete({
    _id: expenseId,
    user: new mongoose.Types.ObjectId(userId),
  });
  
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
  
  // Category breakdown
  const categoryBreakdown = await Expense.aggregate([
    {
      $match: {
        user: userObjectId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);
  
  // Total spending
  const totalSpending = categoryBreakdown.reduce((sum, cat) => sum + cat.total, 0);
  
  // Monthly trend (last 6 months)
  const sixMonthsAgo = subMonths(now, 6);
  const monthlyTrend = await Expense.aggregate([
    {
      $match: {
        user: userObjectId,
        date: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
  
  // Recent expenses
  const recentExpenses = await Expense.find({ user: userObjectId })
    .sort({ date: -1 })
    .limit(5);
  
  // Budget status
  const budgets = await Budget.find({ user: userObjectId, isActive: true });
  const budgetStatus = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await Expense.aggregate([
        {
          $match: {
            user: userObjectId,
            category: budget.category,
            date: { $gte: startOfMonth(now), $lte: endOfMonth(now) },
          },
        },
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
  
  return {
    totalSpending,
    categoryBreakdown: categoryBreakdown.map(cat => ({
      category: cat._id,
      total: cat.total,
      count: cat.count,
      percentage: Math.round((cat.total / totalSpending) * 100) || 0,
    })),
    monthlyTrend: monthlyTrend.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      total: item.total,
      count: item.count,
    })),
    recentExpenses,
    budgetStatus,
    period,
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
