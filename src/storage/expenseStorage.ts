import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense } from '../types';

const STORAGE_KEY = '@expenses_v1';

export const loadExpenses = async (): Promise<Expense[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch (e) {
    console.error('loadExpenses error:', e);
    return [];
  }
};

export const saveExpenses = async (expenses: Expense[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error('saveExpenses error:', e);
  }
};

export const addExpense = async (expense: Expense): Promise<Expense[]> => {
  const existing = await loadExpenses();
  const updated = [expense, ...existing];
  await saveExpenses(updated);
  return updated;
};

export const updateExpense = async (
  id: string,
  changes: Partial<Omit<Expense, 'id' | 'createdAt'>>,
): Promise<Expense[]> => {
  const existing = await loadExpenses();
  const updated = existing.map((e) =>
    e.id === id ? { ...e, ...changes, updatedAt: new Date().toISOString() } : e,
  );
  await saveExpenses(updated);
  return updated;
};

export const deleteExpense = async (id: string): Promise<Expense[]> => {
  const existing = await loadExpenses();
  const updated = existing.filter((e) => e.id !== id);
  await saveExpenses(updated);
  return updated;
};

function daysAgo(base: Date, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export const seedDemoData = async (): Promise<Expense[]> => {
  const existing = await loadExpenses();
  if (existing.length > 0) return existing;

  const now = new Date();
  const ts = new Date().toISOString();

  const demo: Expense[] = [
    { id: 'demo1',  title: 'Grocery Store',    amount: 85.40,  category: 'Food & Dining',  date: daysAgo(now, 0),  description: 'Weekly groceries',   createdAt: ts },
    { id: 'demo2',  title: 'Uber Ride',         amount: 12.50,  category: 'Transportation', date: daysAgo(now, 1),  description: 'Office commute',     createdAt: ts },
    { id: 'demo3',  title: 'Netflix',           amount: 15.99,  category: 'Subscriptions',  date: daysAgo(now, 2),  description: 'Monthly plan',       createdAt: ts },
    { id: 'demo4',  title: 'Electricity Bill',  amount: 120.00, category: 'Utilities',      date: daysAgo(now, 5),  description: 'August bill',        createdAt: ts },
    { id: 'demo5',  title: 'Restaurant Dinner', amount: 54.70,  category: 'Food & Dining',  date: daysAgo(now, 6),  description: 'Family dinner',      createdAt: ts },
    { id: 'demo6',  title: 'Gym Membership',    amount: 40.00,  category: 'Personal Care',  date: daysAgo(now, 8),  description: 'Monthly fee',        createdAt: ts },
    { id: 'demo7',  title: 'Amazon Shopping',   amount: 67.30,  category: 'Shopping',       date: daysAgo(now, 10), description: 'Household items',    createdAt: ts },
    { id: 'demo8',  title: 'Doctor Visit',      amount: 30.00,  category: 'Healthcare',     date: daysAgo(now, 12), description: 'Co-pay',             createdAt: ts },
    { id: 'demo9',  title: 'Bus Pass',          amount: 60.00,  category: 'Transportation', date: daysAgo(now, 15), description: 'Monthly transit',    createdAt: ts },
    { id: 'demo10', title: 'Online Course',     amount: 29.99,  category: 'Education',      date: daysAgo(now, 20), description: 'Udemy course',       createdAt: ts },
  ];

  await saveExpenses(demo);
  return demo;
};
