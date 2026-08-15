export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // ISO date string: "YYYY-MM-DD"
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryMeta {
  label: string;
  icon: string;
  color: string;
}

export type RootStackParamList = {
  MainTabs: undefined;
  AddExpense: undefined;
  EditExpense: { expense: Expense };
};

export type TabParamList = {
  Dashboard: undefined;
  Expenses: undefined;
  Analytics: undefined;
};
