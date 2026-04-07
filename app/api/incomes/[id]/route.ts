import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { updateIncome, deleteIncome } from '@/lib/services/incomes';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const data = await request.json();
    
    const income = await updateIncome(session.userId, id, data);
    
    if (!income) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 });
    }
    
    return NextResponse.json(income);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Update income error:', error);
    return NextResponse.json({ error: 'Failed to update income' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    
    const result = await deleteIncome(session.userId, id);
    
    if (!result) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Delete income error:', error);
    return NextResponse.json({ error: 'Failed to delete income' }, { status: 500 });
  }
}
