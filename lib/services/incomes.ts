import { connectDB } from '../db';
import { Income, IIncome } from '../models/Income';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subMonths, parseISO } from 'date-fns';
import mongoose from 'mongoose';

export interface IncomeFilters {
  source?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  search?: string;
  sortBy?: 'date' | 'amount' | 'source';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function getIncomes(userId: string, filters: IncomeFilters = {}) {
  await connectDB();
  
  const query: Record<string, unknown> = { user: new mongoose.Types.ObjectId(userId) };
  
  if (filters.source && filters.source !== 'all') {
    query.source = filters.source;
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
  } else if (filters.sortBy === 'source') {
    sortStage.source = sortValue;
  } else {
    sortStage.date = sortValue;
  }
  sortStage._id = 1;

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;
  
  const [incomes, total] = await Promise.all([
    Income.find(query).sort(sortStage).skip(skip).limit(limit),
    Income.countDocuments(query),
  ]);
  
  return { incomes, total, page, totalPages: Math.ceil(total / limit) };
}

export async function createIncome(userId: string, data: Partial<IIncome>) {
  await connectDB();
  const income = await Income.create({ ...data, user: new mongoose.Types.ObjectId(userId) });
  return income;
}

export async function updateIncome(userId: string, incomeId: string, data: Partial<IIncome>) {
  await connectDB();
  const income = await Income.findOneAndUpdate(
    { _id: incomeId, user: new mongoose.Types.ObjectId(userId) },
    data,
    { new: true }
  );
  return income;
}

export async function deleteIncome(userId: string, incomeId: string) {
  await connectDB();
  const result = await Income.findOneAndDelete({ _id: incomeId, user: new mongoose.Types.ObjectId(userId) });
  return result;
}

export async function exportIncomesToCSV(userId: string, filters: IncomeFilters = {}) {
  const { incomes } = await getIncomes(userId, { ...filters, limit: 10000 });
  
  const headers = ['Date', 'Description', 'Source', 'Amount', 'Payment Method', 'Notes'];
  const rows = incomes.map(inc => [
    inc.date.toISOString().split('T')[0],
    inc.description,
    inc.source,
    inc.amount.toString(),
    inc.paymentMethod,
    inc.notes || '',
  ]);
  
  const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  return csv;
}
