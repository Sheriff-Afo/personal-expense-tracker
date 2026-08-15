import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BarChart } from 'react-native-chart-kit';
import { loadExpenses } from '../storage/expenseStorage';
import { Expense, RootStackParamList } from '../types';
import { getCategoryMeta } from '../constants/categories';
import StatCard from '../components/StatCard';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getMonthlyData(expenses: Expense[]) {
  const months: { label: string; total: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const total = expenses
      .filter((e) => {
        const ed = new Date(e.date);
        return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
      })
      .reduce((sum, e) => sum + e.amount, 0);
    months.push({ label, total });
  }
  return months;
}

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await loadExpenses();
    setExpenses(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const now = new Date();
  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthlyTotal = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const allTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const recent = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Top category this month
  const catMap: Record<string, number> = {};
  thisMonthExpenses.forEach((e) => {
    catMap[e.category] = (catMap[e.category] ?? 0) + e.amount;
  });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  const topCatMeta = topCat ? getCategoryMeta(topCat[0]) : null;

  const monthlyData = getMonthlyData(expenses);
  const chartData = {
    labels: monthlyData.map((m) => m.label),
    datasets: [{ data: monthlyData.map((m) => Math.max(m.total, 0)) }],
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-extrabold text-gray-900">Dashboard 📊</Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity
            className="bg-primary rounded-xl px-4 py-2"
            onPress={() => navigation.navigate('AddExpense')}
          >
            <Text className="text-white font-bold text-sm">+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Stat cards */}
        <View className="flex-row gap-3 px-5 mt-3">
          <StatCard
            label="This Month"
            value={`$${monthlyTotal.toFixed(0)}`}
            icon="📅"
            hexColor="#6C63FF"
          />
          <StatCard
            label="All Time"
            value={`$${allTotal.toFixed(0)}`}
            icon="💳"
            hexColor="#FF6584"
          />
        </View>
        <View className="flex-row gap-3 px-5 mt-3">
          <StatCard
            label="Transactions"
            value={String(expenses.length)}
            icon="🧾"
            hexColor="#00C9A7"
          />
          <StatCard
            label="Top Category"
            value={topCatMeta ? topCatMeta.icon : '—'}
            icon="🏆"
            hexColor={topCatMeta?.color ?? '#9CA3AF'}
            sub={topCat ? topCat[0] : 'No data'}
          />
        </View>

        {/* Bar chart */}
        <View className="mx-5 mt-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-base font-bold text-gray-900 mb-3">6-Month Spending</Text>
          <BarChart
            data={chartData}
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
              barPercentage: 0.6,
              propsForBackgroundLines: { strokeDasharray: '', stroke: '#F3F4F6' },
            }}
            style={{ borderRadius: 12 }}
            showValuesOnTopOfBars
            fromZero
          />
        </View>

        {/* Recent expenses */}
        <View className="px-5 mt-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-bold text-gray-900">Recent Expenses</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Expenses' } as any)}>
              <Text className="text-sm text-primary font-semibold">See all →</Text>
            </TouchableOpacity>
          </View>

          {recent.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center border border-gray-100">
              <Text className="text-4xl mb-3">💸</Text>
              <Text className="text-gray-500 text-sm text-center">
                No expenses yet.{'\n'}Tap "+ Add" to get started!
              </Text>
            </View>
          ) : (
            recent.map((expense) => {
              const meta = getCategoryMeta(expense.category);
              const date = new Date(expense.date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short', day: 'numeric',
              });
              return (
                <View
                  key={expense.id}
                  className="flex-row items-center bg-white rounded-2xl px-4 py-3 mb-2 border border-gray-100 shadow-sm"
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: meta.color + '22' }}
                  >
                    <Text className="text-xl">{meta.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                      {expense.title}
                    </Text>
                    <Text className="text-xs text-gray-400">{date}</Text>
                  </View>
                  <Text className="text-sm font-bold text-gray-800">
                    ${expense.amount.toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
