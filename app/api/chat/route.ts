import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ChatMessage } from '@/lib/models/ChatMessage';
import { Expense } from '@/lib/models/Expense';
import { Budget } from '@/lib/models/Budget';
import { processUserMessage, AIResponse } from '@/lib/services/gemini';
import { createExpense, deleteExpense, updateExpense, getAnalytics } from '@/lib/services/expenses';
import mongoose from 'mongoose';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const PAYMENT_METHOD_ENUM = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other'] as const;

function normalizePaymentMethod(raw?: string): string {
  if (!raw) return 'Cash';
  const lower = raw.toLowerCase().trim();
  const match = PAYMENT_METHOD_ENUM.find(m => m.toLowerCase() === lower);
  return match ?? 'Cash';
}

async function buildUserContext(userId: string): Promise<string> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  // Get this month's spending
  const monthlyExpenses = await Expense.aggregate([
    {
      $match: {
        user: userObjectId,
        date: { $gte: monthStart, $lte: monthEnd },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
  
  const totalThisMonth = monthlyExpenses.reduce((sum, cat) => sum + cat.total, 0);
  
  // Get budgets
  const budgets = await Budget.find({ user: userObjectId, isActive: true });
  
  // Get recent expenses
  const recentExpenses = await Expense.find({ user: userObjectId })
    .sort({ date: -1 })
    .limit(5);
  
  return `
Current Month: ${format(now, 'MMMM yyyy')}
Total Spent This Month: $${totalThisMonth.toFixed(2)}

Spending by Category This Month:
${monthlyExpenses.map(cat => `- ${cat._id}: $${cat.total.toFixed(2)} (${cat.count} transactions)`).join('\n')}

Active Budgets:
${budgets.map(b => `- ${b.category}: $${b.amount}/month`).join('\n') || 'No budgets set'}

Recent Expenses:
${recentExpenses.map(exp => `- ${format(exp.date, 'MMM dd')}: ${exp.description} - $${exp.amount} (${exp.category})`).join('\n')}
  `.trim();
}

export async function GET() {
  try {
    const session = await requireAuth();
    await connectDB();
    
    const messages = await ChatMessage.find({
      user: new mongoose.Types.ObjectId(session.userId),
    })
      .sort({ createdAt: -1 })
      .limit(50);
    
    return NextResponse.json(messages.reverse());
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get chat history error:', error);
    return NextResponse.json({ error: 'Failed to get chat history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(session.userId);
    
    // Save user message
    const userMessage = await ChatMessage.create({
      user: userObjectId,
      role: 'user',
      content: message,
    });
    
    // Get chat history for context
    const chatHistory = await ChatMessage.find({ user: userObjectId })
      .sort({ createdAt: -1 })
      .limit(20);
    
    const historyForAI = chatHistory.reverse().map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // Build user context
    const userContext = await buildUserContext(session.userId);
    
    // Process with AI
    const aiResponse: AIResponse = await processUserMessage(message, historyForAI, userContext);
    
    let actionResult = '';
    const createdExpenseIds: mongoose.Types.ObjectId[] = [];
    
    // Handle different intents
    if (aiResponse.intent === 'add_expense' && aiResponse.expenses?.length) {
      for (const exp of aiResponse.expenses) {
        const created = await createExpense(session.userId, {
          amount: exp.amount,
          category: exp.category,
          description: exp.description,
          date: exp.date,
          paymentMethod: normalizePaymentMethod(exp.paymentMethod),
        });
        createdExpenseIds.push(created._id);
      }
      actionResult = `Created ${aiResponse.expenses.length} expense(s)`;
    } else if (aiResponse.intent === 'delete' && aiResponse.deleteTarget) {
      const target = aiResponse.deleteTarget;
      const query: Record<string, unknown> = { user: userObjectId };
      
      if (target.description) {
        query.description = { $regex: target.description, $options: 'i' };
      }
      if (target.category) {
        query.category = target.category;
      }
      if (target.amount) {
        query.amount = target.amount;
      }
      
      const expenseToDelete = await Expense.findOne(query).sort({ date: -1 });
      if (expenseToDelete) {
        await deleteExpense(session.userId, expenseToDelete._id.toString());
        actionResult = `Deleted expense: ${expenseToDelete.description}`;
      }
    } else if (aiResponse.intent === 'update' && aiResponse.updateTarget) {
      const target = aiResponse.updateTarget;
      const query: Record<string, unknown> = { user: userObjectId };
      
      if (target.description) {
        query.description = { $regex: target.description, $options: 'i' };
      }
      
      const expenseToUpdate = await Expense.findOne(query).sort({ date: -1 });
      if (expenseToUpdate) {
        const updateData: any = {};
        if (target.newAmount !== undefined) updateData.amount = target.newAmount;
        if (target.newCategory) updateData.category = target.newCategory;
        if (target.newDescription) updateData.description = target.newDescription;
        
        const updated = await updateExpense(session.userId, expenseToUpdate._id.toString(), updateData);
        if (updated) {
          actionResult = `Updated expense: ${updated.description}`;
        }
      }
    } else if (aiResponse.intent === 'analytics') {
      const analytics = await getAnalytics(session.userId, 'month');
      aiResponse.response += `\n\nQuick Stats:\n- Total this month: $${analytics.totalSpending.toFixed(2)}\n- Top category: ${analytics.categoryBreakdown[0]?.category || 'N/A'}`;
    }
    
    // Save assistant response
    const assistantMessage = await ChatMessage.create({
      user: userObjectId,
      role: 'assistant',
      content: aiResponse.response,
      metadata: {
        intent: aiResponse.intent,
        expenseIds: createdExpenseIds,
        actionTaken: actionResult,
      },
    });
    
    return NextResponse.json({
      userMessage,
      assistantMessage,
      intent: aiResponse.intent,
      actionTaken: actionResult,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await requireAuth();
    await connectDB();
    
    await ChatMessage.deleteMany({
      user: new mongoose.Types.ObjectId(session.userId),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Clear chat error:', error);
    return NextResponse.json({ error: 'Failed to clear chat' }, { status: 500 });
  }
}
