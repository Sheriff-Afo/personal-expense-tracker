import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { loadExpenses } from '../storage/expenseStorage';
import { Transaction } from '../types';
import { getCategoryMeta, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getMonthlyData(transactions: Transaction[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const inMonth = transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
    });
    const income  = inMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = inMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { label, income: parseFloat(income.toFixed(2)), expense: parseFloat(expense.toFixed(2)) };
  });
}

export default function AnalyticsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setTransactions(await loadExpenses());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const expenses = transactions.filter((t) => t.type === 'expense');
  const incomes  = transactions.filter((t) => t.type === 'income');

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome  = incomes.reduce((s, t) => s + t.amount, 0);
  const netBalance   = totalIncome - totalExpense;
  const savingsRate  = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Monthly dual-line data
  const monthly = getMonthlyData(transactions);
  const dualLineData = {
    labels: monthly.map((m) => m.label),
    datasets: [
      {
        data: monthly.map((m) => Math.max(m.income, 0)),
        color: (opacity = 1) => `rgba(0, 201, 167, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: monthly.map((m) => Math.max(m.expense, 0)),
        color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Income', 'Expenses'],
  };

  // Expense category breakdown
  const expCatMap: Record<string, number> = {};
  expenses.forEach((t) => { expCatMap[t.category] = (expCatMap[t.category] ?? 0) + t.amount; });
  const sortedExpCats = Object.entries(expCatMap).sort((a, b) => b[1] - a[1]);

  // Income category breakdown
  const incCatMap: Record<string, number> = {};
  incomes.forEach((t) => { incCatMap[t.category] = (incCatMap[t.category] ?? 0) + t.amount; });
  const sortedIncCats = Object.entries(incCatMap).sort((a, b) => b[1] - a[1]);

  // Pie chart data for expenses (top 7)
  const expPieData = EXPENSE_CATEGORIES
    .filter((c) => expCatMap[c.label])
    .map((c) => ({
      name: c.label.split(' ')[0],
      population: expCatMap[c.label],
      color: c.color,
      legendFontColor: '#6B7280',
      legendFontSize: 10,
    }))
    .slice(0, 7);

  // Pie chart data for income (top 7)
  const incPieData = INCOME_CATEGORIES
    .filter((c) => incCatMap[c.label])
    .map((c) => ({
      name: c.label.split(' ')[0],
      population: incCatMap[c.label],
      color: c.color,
      legendFontColor: '#6B7280',
      legendFontSize: 10,
    }))
    .slice(0, 7);

  const highest = expenses.length
    ? expenses.reduce((max, t) => (t.amount > max.amount ? t : max), expenses[0])
    : null;

  const avgExpense = expenses.length ? totalExpense / expenses.length : 0;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <Text className="text-2xl font-extrabold text-gray-900">Analytics 📈</Text>
          <Text className="text-sm text-gray-500 mt-0.5">Your financial insights</Text>
        </View>

        {/* Top summary row */}
        <View className="flex-row gap-3 px-5 mb-3">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
            <Text className="text-lg font-extrabold text-success">+${totalIncome.toFixed(0)}</Text>
            <Text className="text-xs text-gray-500 mt-1">Total Income</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
            <Text className="text-lg font-extrabold text-danger">-${totalExpense.toFixed(0)}</Text>
            <Text className="text-xs text-gray-500 mt-1">Total Spent</Text>
          </View>
        </View>

        {/* Net balance + savings rate row */}
        <View className="flex-row gap-3 px-5 mb-5">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
            <Text
              className="text-lg font-extrabold"
              style={{ color: netBalance >= 0 ? '#00C9A7' : '#FF6B6B' }}
            >
              {netBalance >= 0 ? '+' : '-'}${Math.abs(netBalance).toFixed(0)}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">Net Balance</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
            <Text
              className="text-lg font-extrabold"
              style={{ color: savingsRate >= 0 ? '#00C9A7' : '#FF6B6B' }}
            >
              {savingsRate.toFixed(1)}%
            </Text>
            <Text className="text-xs text-gray-500 mt-1">Savings Rate</Text>
          </View>
        </View>

        {/* Dual-line income vs expense chart */}
        <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <Text className="text-base font-bold text-gray-900 mb-1">Income vs Expenses</Text>
          <Text className="text-xs text-gray-400 mb-3">6-month trend</Text>
          {transactions.length > 0 ? (
            <>
              <LineChart
                data={dualLineData}
                width={SCREEN_WIDTH - 72}
                height={200}
                yAxisLabel="$"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
                  labelColor: () => '#6B7280',
                  propsForDots: { r: '4', strokeWidth: '2' },
                  propsForBackgroundLines: { strokeDasharray: '', stroke: '#F3F4F6' },
                }}
                bezier
                style={{ borderRadius: 12 }}
                withShadow={false}
              />
              {/* Legend */}
              <View className="flex-row justify-center gap-6 mt-2">
                <View className="flex-row items-center gap-1.5">
                  <View className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00C9A7' }} />
                  <Text className="text-xs text-gray-600">Income</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF6B6B' }} />
                  <Text className="text-xs text-gray-600">Expenses</Text>
                </View>
              </View>
            </>
          ) : (
            <EmptyChart text="Add transactions to see trends" />
          )}
        </View>

        {/* Expense pie chart */}
        {expPieData.length > 0 && (
          <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-3">🔴 Spending by Category</Text>
            <PieChart
              data={expPieData}
              width={SCREEN_WIDTH - 72}
              height={180}
              chartConfig={{ color: (o = 1) => `rgba(0,0,0,${o})` }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute={false}
            />
          </View>
        )}

        {/* Income pie chart */}
        {incPieData.length > 0 && (
          <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-3">💚 Income by Source</Text>
            <PieChart
              data={incPieData}
              width={SCREEN_WIDTH - 72}
              height={180}
              chartConfig={{ color: (o = 1) => `rgba(0,0,0,${o})` }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute={false}
            />
          </View>
        )}

        {/* Expense category breakdown */}
        {sortedExpCats.length > 0 && (
          <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-3">Expense Breakdown</Text>
            {sortedExpCats.map(([cat, amt]) => {
              const meta = getCategoryMeta(cat);
              const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
              return (
                <View key={cat} className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base">{meta.icon}</Text>
                      <Text className="text-sm font-medium text-gray-800">{cat}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs text-gray-400">{pct.toFixed(1)}%</Text>
                      <Text className="text-sm font-bold text-gray-900">${amt.toFixed(2)}</Text>
                    </View>
                  </View>
                  <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Income category breakdown */}
        {sortedIncCats.length > 0 && (
          <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-3">Income Sources</Text>
            {sortedIncCats.map(([cat, amt]) => {
              const meta = getCategoryMeta(cat);
              const pct = totalIncome > 0 ? (amt / totalIncome) * 100 : 0;
              return (
                <View key={cat} className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base">{meta.icon}</Text>
                      <Text className="text-sm font-medium text-gray-800">{cat}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs text-gray-400">{pct.toFixed(1)}%</Text>
                      <Text className="text-sm font-bold text-success">${amt.toFixed(2)}</Text>
                    </View>
                  </View>
                  <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Stats row */}
        <View className="flex-row gap-3 px-5 mb-5">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
            <Text className="text-lg font-extrabold text-primary">${avgExpense.toFixed(0)}</Text>
            <Text className="text-xs text-gray-500 mt-1">Avg / Expense</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
            <Text className="text-lg font-extrabold text-warning">{transactions.length}</Text>
            <Text className="text-xs text-gray-500 mt-1">All Transactions</Text>
          </View>
        </View>

        {/* Highest single expense */}
        {highest && (
          <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-3">🏆 Largest Expense</Text>
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: getCategoryMeta(highest.category).color + '22' }}
              >
                <Text className="text-2xl">{getCategoryMeta(highest.category).icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                  {highest.title}
                </Text>
                <Text className="text-xs text-gray-500">{highest.category} · {highest.date}</Text>
              </View>
              <Text className="text-lg font-extrabold text-danger">
                ${highest.amount.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Empty state */}
        {transactions.length === 0 && (
          <View className="mx-5 bg-white rounded-2xl p-10 border border-gray-100 items-center">
            <Text className="text-5xl mb-4">📊</Text>
            <Text className="text-gray-500 text-sm text-center">
              No transactions yet.{'\n'}Add income and expenses to see your analytics!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <View className="h-40 items-center justify-center">
      <Text className="text-gray-400 text-sm">{text}</Text>
    </View>
  );
}
