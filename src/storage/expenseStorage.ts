import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../types';

const STORAGE_KEY = '@transactions_v2';

export const loadExpenses = async (): Promise<Transaction[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch (e) {
    console.error('loadExpenses error:', e);
    return [];
  }
};

export const saveExpenses = async (transactions: Transaction[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error('saveExpenses error:', e);
  }
};

export const addExpense = async (transaction: Transaction): Promise<Transaction[]> => {
  const existing = await loadExpenses();
  const updated = [transaction, ...existing];
  await saveExpenses(updated);
  return updated;
};

export const updateExpense = async (
  id: string,
  changes: Partial<Omit<Transaction, 'id' | 'createdAt'>>,
): Promise<Transaction[]> => {
  const existing = await loadExpenses();
  const updated = existing.map((t) =>
    t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t,
  );
  await saveExpenses(updated);
  return updated;
};

export const deleteExpense = async (id: string): Promise<Transaction[]> => {
  const existing = await loadExpenses();
  const updated = existing.filter((t) => t.id !== id);
  await saveExpenses(updated);
  return updated;
};

function daysAgo(base: Date, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export const seedDemoData = async (): Promise<Transaction[]> => {
  const existing = await loadExpenses();
  if (existing.length > 0) return existing;

  const now = new Date();
  const ts = new Date().toISOString();

  const demo: Transaction[] = [
    // — Income —
    { id: 'demo_i1', type: 'income',  title: 'Monthly Salary',     amount: 3500.00, category: 'Salary',       date: daysAgo(now, 0),  description: 'August paycheck',     createdAt: ts },
    { id: 'demo_i2', type: 'income',  title: 'Freelance Project',  amount: 850.00,  category: 'Freelance',    date: daysAgo(now, 3),  description: 'Web design contract', createdAt: ts },
    { id: 'demo_i3', type: 'income',  title: 'Stock Dividend',     amount: 125.50,  category: 'Investment',   date: daysAgo(now, 8),  description: 'Q3 dividend payout',  createdAt: ts },
    { id: 'demo_i4', type: 'income',  title: 'Side Hustle Income', amount: 200.00,  category: 'Side Hustle',  date: daysAgo(now, 12), description: 'Online tutoring',     createdAt: ts },
    { id: 'demo_i5', type: 'income',  title: 'Birthday Gift',      amount: 100.00,  category: 'Gift',         date: daysAgo(now, 20), description: 'From family',         createdAt: ts },
    // — Expenses —
    { id: 'demo_e1', type: 'expense', title: 'Grocery Store',      amount: 85.40,   category: 'Food & Dining',  date: daysAgo(now, 1),  description: 'Weekly groceries',  createdAt: ts },
    { id: 'demo_e2', type: 'expense', title: 'Uber Ride',          amount: 12.50,   category: 'Transportation', date: daysAgo(now, 2),  description: 'Office commute',    createdAt: ts },
    { id: 'demo_e3', type: 'expense', title: 'Netflix',            amount: 15.99,   category: 'Subscriptions',  date: daysAgo(now, 4),  description: 'Monthly plan',      createdAt: ts },
    { id: 'demo_e4', type: 'expense', title: 'Electricity Bill',   amount: 120.00,  category: 'Utilities',      date: daysAgo(now, 5),  description: 'August bill',       createdAt: ts },
    { id: 'demo_e5', type: 'expense', title: 'Restaurant Dinner',  amount: 54.70,   category: 'Food & Dining',  date: daysAgo(now, 6),  description: 'Family dinner',     createdAt: ts },
    { id: 'demo_e6', type: 'expense', title: 'Gym Membership',     amount: 40.00,   category: 'Personal Care',  date: daysAgo(now, 9),  description: 'Monthly fee',       createdAt: ts },
    { id: 'demo_e7', type: 'expense', title: 'Amazon Shopping',    amount: 67.30,   category: 'Shopping',       date: daysAgo(now, 11), description: 'Household items',   createdAt: ts },
    { id: 'demo_e8', type: 'expense', title: 'Doctor Visit',       amount: 30.00,   category: 'Healthcare',     date: daysAgo(now, 14), description: 'Co-pay',            createdAt: ts },
    { id: 'demo_e9', type: 'expense', title: 'Bus Pass',           amount: 60.00,   category: 'Transportation', date: daysAgo(now, 16), description: 'Monthly transit',   createdAt: ts },
    { id: 'demo_e10',type: 'expense', title: 'Online Course',      amount: 29.99,   category: 'Education',      date: daysAgo(now, 22), description: 'Udemy course',      createdAt: ts },
  ];

  await saveExpenses(demo);
  return demo;
};
