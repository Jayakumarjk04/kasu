import { connectDB } from '../db';
import { Goal, IGoal } from '../models/Goal';
import mongoose from 'mongoose';

export async function getGoals(userId: string) {
  await connectDB();
  const goals = await Goal.find({ user: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
  return goals;
}

export async function getActiveGoals(userId: string) {
  await connectDB();
  const goals = await Goal.find({ user: new mongoose.Types.ObjectId(userId), status: 'active' }).sort({ createdAt: -1 });
  return goals;
}

export async function createGoal(userId: string, data: Partial<IGoal>) {
  await connectDB();
  const goal = await Goal.create({ ...data, user: new mongoose.Types.ObjectId(userId) });
  return goal;
}

export async function updateGoal(userId: string, goalId: string, data: Partial<IGoal>) {
  await connectDB();
  const goal = await Goal.findOneAndUpdate(
    { _id: goalId, user: new mongoose.Types.ObjectId(userId) },
    data,
    { new: true }
  );
  return goal;
}

export async function deleteGoal(userId: string, goalId: string) {
  await connectDB();
  const result = await Goal.findOneAndDelete({ _id: goalId, user: new mongoose.Types.ObjectId(userId) });
  return result;
}

export async function addFundsToGoal(userId: string, goalId: string, amount: number) {
  await connectDB();
  const goal = await Goal.findOneAndUpdate(
    { _id: goalId, user: new mongoose.Types.ObjectId(userId) },
    { $inc: { currentAmount: amount } },
    { new: true }
  );
  
  if (goal && goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
    goal.status = 'completed';
    await goal.save();
  }
  
  return goal;
}
