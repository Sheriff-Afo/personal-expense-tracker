export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  category: string;
  date: string; // ISO date string: "YYYY-MM-DD"
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

/** @deprecated Use Transaction instead */
export type Expense = Transaction;

export interface CategoryMeta {
  label: string;
  icon: string;
  color: string;
}

export type RootStackParamList = {
  MainTabs: undefined;
  AddTransaction: undefined;
  EditTransaction: { transaction: Transaction };
};

export type TabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Analytics: undefined;
  Settings: undefined;
};
