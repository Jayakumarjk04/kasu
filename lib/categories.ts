import {
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Receipt,
  Heart,
  GraduationCap,
  Plane,
  Sparkles,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  HelpCircle,
  LucideIcon,
  Briefcase,
  Laptop,
  TrendingDown,
  Gift,
  Key,
  Zap,
} from 'lucide-react';

export const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Personal Care',
  'Groceries',
  'Subscriptions',
  'Investment',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Shopping': ShoppingBag,
  'Entertainment': Film,
  'Bills & Utilities': Receipt,
  'Healthcare': Heart,
  'Education': GraduationCap,
  'Travel': Plane,
  'Personal Care': Sparkles,
  'Groceries': ShoppingCart,
  'Subscriptions': CreditCard,
  'Investment': TrendingUp,
  'Other': HelpCircle,
};

export const CATEGORY_COLORS: Record<Category, string> = {
  'Food & Dining': 'bg-orange-500',
  'Transportation': 'bg-blue-500',
  'Shopping': 'bg-pink-500',
  'Entertainment': 'bg-purple-500',
  'Bills & Utilities': 'bg-yellow-500',
  'Healthcare': 'bg-red-500',
  'Education': 'bg-indigo-500',
  'Travel': 'bg-cyan-500',
  'Personal Care': 'bg-rose-500',
  'Groceries': 'bg-green-500',
  'Subscriptions': 'bg-violet-500',
  'Investment': 'bg-emerald-500',
  'Other': 'bg-gray-500',
};

export const INCOME_SOURCES = [
  'Salary',
  'Freelance',
  'Investments',
  'Business',
  'Gifts',
  'Rental',
  'Other',
] as const;

export type IncomeSource = typeof INCOME_SOURCES[number];

export const INCOME_SOURCE_ICONS: Record<IncomeSource, LucideIcon> = {
  'Salary': Briefcase,
  'Freelance': Laptop,
  'Investments': TrendingUp,
  'Business': Zap,
  'Gifts': Gift,
  'Rental': Key,
  'Other': HelpCircle,
};

export const INCOME_SOURCE_COLORS: Record<IncomeSource, string> = {
  'Salary': 'bg-emerald-500',
  'Freelance': 'bg-blue-500',
  'Investments': 'bg-violet-500',
  'Business': 'bg-amber-500',
  'Gifts': 'bg-pink-500',
  'Rental': 'bg-indigo-500',
  'Other': 'bg-gray-500',
};

export const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'UPI',
  'Bank Transfer',
  'Other',
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];
