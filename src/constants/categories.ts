import { CategoryMeta } from '../types';

export const CATEGORIES: CategoryMeta[] = [
  { label: 'Food & Dining',  icon: '🍔', color: '#FF6B6B' },
  { label: 'Transportation', icon: '🚗', color: '#4ECDC4' },
  { label: 'Housing',        icon: '🏠', color: '#45B7D1' },
  { label: 'Utilities',      icon: '💡', color: '#96CEB4' },
  { label: 'Healthcare',     icon: '🏥', color: '#FFEAA7' },
  { label: 'Entertainment',  icon: '🎬', color: '#DDA0DD' },
  { label: 'Shopping',       icon: '🛍️', color: '#F0A500' },
  { label: 'Education',      icon: '📚', color: '#74B9FF' },
  { label: 'Travel',         icon: '✈️', color: '#A29BFE' },
  { label: 'Personal Care',  icon: '💅', color: '#FD79A8' },
  { label: 'Subscriptions',  icon: '📱', color: '#00CEC9' },
  { label: 'Other',          icon: '📦', color: '#B2BEC3' },
];

export const CATEGORY_LABELS = CATEGORIES.map((c) => c.label);

export const getCategoryMeta = (label: string): CategoryMeta =>
  CATEGORIES.find((c) => c.label === label) ?? CATEGORIES[CATEGORIES.length - 1];
