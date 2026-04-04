import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Budget } from '@/lib/models/Budget';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await requireAuth();
    await connectDB();
    
    const budgets = await Budget.find({
      user: new mongoose.Types.ObjectId(session.userId),
      isActive: true,
    }).sort({ category: 1 });
    
    return NextResponse.json(budgets);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get budgets error:', error);
    return NextResponse.json({ error: 'Failed to get budgets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await request.json();
    
    await connectDB();
    
    const existing = await Budget.findOne({
      user: new mongoose.Types.ObjectId(session.userId),
      category: data.category,
    });
    
    if (existing) {
      existing.amount = data.amount;
      existing.period = data.period || 'monthly';
      existing.isActive = true;
      await existing.save();
      return NextResponse.json(existing);
    }
    
    const budget = await Budget.create({
      user: new mongoose.Types.ObjectId(session.userId),
      category: data.category,
      amount: data.amount,
      period: data.period || 'monthly',
    });
    
    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create budget error:', error);
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 });
  }
}
