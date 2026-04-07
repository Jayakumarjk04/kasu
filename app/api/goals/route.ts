import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getGoals, createGoal } from '@/lib/services/goals';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const goals = await getGoals(session.userId);
    return NextResponse.json(goals);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get goals error:', error);
    return NextResponse.json({ error: 'Failed to get goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await request.json();
    
    const goal = await createGoal(session.userId, {
      title: data.title,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount || 0,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      color: data.color || 'bg-emerald-500',
      icon: data.icon || 'PiggyBank',
      status: data.status || 'active',
    });
    
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create goal error:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
