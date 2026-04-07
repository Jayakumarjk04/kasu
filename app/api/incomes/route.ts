import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getIncomes, createIncome } from '@/lib/services/incomes';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const filters = {
      source: searchParams.get('source') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
      maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as 'date' | 'amount' | 'source') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };
    
    const result = await getIncomes(session.userId, filters);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get incomes error:', error);
    return NextResponse.json({ error: 'Failed to get incomes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await request.json();
    
    const income = await createIncome(session.userId, {
      amount: data.amount,
      source: data.source,
      description: data.description,
      date: data.date ? new Date(data.date) : new Date(),
      paymentMethod: data.paymentMethod || 'Bank Transfer',
      notes: data.notes,
      isRecurring: data.isRecurring || false,
      tags: data.tags || [],
    });
    
    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create income error:', error);
    return NextResponse.json({ error: 'Failed to create income' }, { status: 500 });
  }
}
