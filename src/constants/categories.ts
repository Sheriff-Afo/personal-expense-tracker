import { CategoryMeta, TransactionType } from '../types';

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { label: 'Food & Dining',  icon: '🍔', color: '#FF6B6B' },
  { label: 'Transportation', icon: '🚗', color: '#4ECDC4' },
  { label: 'Housing',        icon: '🏠', color: '#45B7D1' },
  { label: 'Utilities',      icon: '💡', color: '#96CEB4' },
  { label: 'Healthcare',     icon: '🏥', color: '#F0A500' },
  { label: 'Entertainment',  icon: '🎬', color: '#DDA0DD' },
  { label: 'Shopping',       icon: '🛍️', color: '#F0A500' },
  { label: 'Education',      icon: '📚', color: '#74B9FF' },
  { label: 'Travel',         icon: '✈️', color: '#A29BFE' },
  { label: 'Personal Care',  icon: '💅', color: '#FD79A8' },
  { label: 'Subscriptions',  icon: '📱', color: '#00CEC9' },
  { label: 'Other',          icon: '📦', color: '#B2BEC3' },
];

export const INCOME_CATEGORIES: CategoryMeta[] = [
  { label: 'Salary',        icon: '💼', color: '#00C9A7' },
  { label: 'Freelance',     icon: '💻', color: '#4CAF50' },
  { label: 'Business',      icon: '🏢', color: '#2196F3' },
  { label: 'Investment',    icon: '📈', color: '#9C27B0' },
  { label: 'Gift',          icon: '🎁', color: '#FF9800' },
  { label: 'Rental',        icon: '🏘️', color: '#795548' },
  { label: 'Side Hustle',   icon: '⚡', color: '#FFC107' },
  { label: 'Other Income',  icon: '💰', color: '#607D8B' },
];

/** All categories combined — for lookups. */
const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

/** @deprecated Use EXPENSE_CATEGORIES */
export const CATEGORIES = EXPENSE_CATEGORIES;

export const EXPENSE_CATEGORY_LABELS = EXPENSE_CATEGORIES.map((c) => c.label);
export const INCOME_CATEGORY_LABELS = INCOME_CATEGORIES.map((c) => c.label);

/** @deprecated Use EXPENSE_CATEGORY_LABELS */
export const CATEGORY_LABELS = EXPENSE_CATEGORY_LABELS;

export const getCategoryMeta = (label: string): CategoryMeta =>
  ALL_CATEGORIES.find((c) => c.label === label) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];

export const getCategoriesForType = (type: TransactionType): CategoryMeta[] =>
  type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
