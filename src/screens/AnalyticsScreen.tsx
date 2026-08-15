import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { loadExpenses } from '../storage/expenseStorage';
import { Expense } from '../types';
import { getCategoryMeta, CATEGORIES } from '../constants/categories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getMonthlyTotals(expenses: Expense[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const total = expenses
      .filter((e) => {
        const ed = new Date(e.date);
        return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
      })
      .reduce((s, e) => s + e.amount, 0);
    return { label, total: parseFloat(total.toFixed(2)) };
  });
}

export default function AnalyticsScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setExpenses(await loadExpenses());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // Category totals
  const catMap: Record<string, number> = {};
  expenses.forEach((e) => { catMap[e.category] = (catMap[e.category] ?? 0) + e.amount; });
  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);

  // Pie chart data (top 6 + other)
  const pieData = CATEGORIES
    .filter((c) => catMap[c.label])
    .map((c) => ({
      name: c.label.split(' ')[0], // shorten label
      population: catMap[c.label],
      color: c.color,
      legendFontColor: '#6B7280',
      legendFontSize: 11,
    }))
    .slice(0, 7);

  // Monthly line chart
  const monthly = getMonthlyTotals(expenses);
  const lineData = {
    labels: monthly.map((m) => m.label),
    datasets: [{ data: monthly.map((m) => Math.max(m.total, 0)), strokeWidth: 2 }],
  };

  const avg = expenses.length ? grandTotal / expenses.length : 0;
  const highest = expenses.length
    ? expenses.reduce((max, e) => (e.amount > max.amount ? e : max), expenses[0])
    : null;

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
          <Text className="text-sm text-gray-500 mt-0.5">Your spending insights</Text>
        </View>

        {/* Summary row */}
        <View className="flex-row gap-3 px-5 mb-5">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
            <Text className="text-xl font-extrabold text-primary">${grandTotal.toFixed(0)}</Text>
            <Text className="text-xs text-gray-500 mt-1">Total Spent</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
            <Text className="text-xl font-extrabold text-success">${avg.toFixed(0)}</Text>
            <Text className="text-xs text-gray-500 mt-1">Avg / Expense</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
            <Text className="text-xl font-extrabold text-warning">{expenses.length}</Text>
            <Text className="text-xs text-gray-500 mt-1">Transactions</Text>
          </View>
        </View>

        {/* Spending trend line chart */}
        <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <Text className="text-base font-bold text-gray-900 mb-3">Spending Trend</Text>
          {expenses.length > 0 ? (
            <LineChart
              data={lineData}
              width={SCREEN_WIDTH - 72}
              height={180}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
                labelColor: () => '#6B7280',
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#6C63FF' },
                propsForBackgroundLines: { strokeDasharray: '', stroke: '#F3F4F6' },
              }}
              bezier
              style={{ borderRadius: 12 }}
            />
          ) : (
            <EmptyChart />
          )}
        </View>

        {/* Pie chart */}
        {pieData.length > 0 && (
          <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-3">Spending by Category</Text>
            <PieChart
              data={pieData}
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

        {/* Category breakdown list */}
        <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <Text className="text-base font-bold text-gray-900 mb-3">Category Breakdown</Text>
          {sortedCats.length === 0 ? (
            <Text className="text-sm text-gray-400 text-center py-4">No data yet</Text>
          ) : (
            sortedCats.map(([cat, amount]) => {
              const meta = getCategoryMeta(cat);
              const pct = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
              return (
                <View key={cat} className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base">{meta.icon}</Text>
                      <Text className="text-sm font-medium text-gray-800">{cat}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs text-gray-400">{pct.toFixed(1)}%</Text>
                      <Text className="text-sm font-bold text-gray-900">${amount.toFixed(2)}</Text>
                    </View>
                  </View>
                  {/* Progress bar */}
                  <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Highest expense */}
        {highest && (
          <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-3">🏆 Highest Expense</Text>
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: getCategoryMeta(highest.category).color + '22' }}
              >
                <Text className="text-2xl">{getCategoryMeta(highest.category).icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">{highest.title}</Text>
                <Text className="text-xs text-gray-500">{highest.category} · {highest.date}</Text>
              </View>
              <Text className="text-lg font-extrabold text-danger">
                ${highest.amount.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyChart() {
  return (
    <View className="h-40 items-center justify-center">
      <Text className="text-gray-400 text-sm">Add expenses to see trends</Text>
    </View>
  );
}
