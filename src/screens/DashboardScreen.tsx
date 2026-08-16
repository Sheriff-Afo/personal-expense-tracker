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
import { Transaction, RootStackParamList } from '../types';
import { getCategoryMeta } from '../constants/categories';
import { useCurrency } from '../context/CurrencyContext';
import StatCard from '../components/StatCard';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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
    const income = inMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = inMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { label, income, expense, net: income - expense };
  });
}

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { sym, fmt } = useCurrency();

  const load = useCallback(async () => {
    setTransactions(await loadExpenses());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const now = new Date();
  const thisMonth = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const monthlyIncome  = thisMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthlyExpense = thisMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthlyNet     = monthlyIncome - monthlyExpense;

  const totalIncome  = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netBalance   = totalIncome - totalExpense;

  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const monthlyData = getMonthlyData(transactions);

  const chartData = {
    labels: monthlyData.map((m) => m.label),
    datasets: [{ data: monthlyData.map((m) => Math.max(m.expense, 0)) }],
  };

  const netColor = monthlyNet >= 0 ? '#00C9A7' : '#FF6B6B';
  const netBalanceColor = netBalance >= 0 ? '#00C9A7' : '#FF6B6B';

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
            onPress={() => navigation.navigate('AddTransaction')}
          >
            <Text className="text-white font-bold text-sm">+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Net balance hero card */}
        <View className="mx-5 mt-3 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm items-center">
          <Text className="text-sm text-gray-500 mb-1">Net Balance (All Time)</Text>
          <Text className="text-4xl font-extrabold" style={{ color: netBalanceColor }}>
            {netBalance >= 0 ? '+' : '-'}{fmt(Math.abs(netBalance))}
          </Text>
          <View className="flex-row gap-6 mt-3">
            <View className="items-center">
              <Text className="text-xs text-gray-400 mb-0.5">Total Income</Text>
              <Text className="text-base font-bold text-success">+{fmt(totalIncome, 0)}</Text>
            </View>
            <View className="w-px bg-gray-100" />
            <View className="items-center">
              <Text className="text-xs text-gray-400 mb-0.5">Total Expenses</Text>
              <Text className="text-base font-bold text-danger">-{fmt(totalExpense, 0)}</Text>
            </View>
          </View>
        </View>

        {/* This month stat cards */}
        <View className="flex-row gap-3 px-5 mt-3">
          <StatCard
            label="Income (Month)"
            value={fmt(monthlyIncome, 0)}
            icon="💚"
            hexColor="#00C9A7"
          />
          <StatCard
            label="Expenses (Month)"
            value={fmt(monthlyExpense, 0)}
            icon="🔴"
            hexColor="#FF6B6B"
          />
        </View>
        <View className="flex-row gap-3 px-5 mt-3">
          <StatCard
            label="Net (Month)"
            value={`${monthlyNet >= 0 ? '+' : '-'}${fmt(Math.abs(monthlyNet), 0)}`}
            icon={monthlyNet >= 0 ? '🎯' : '⚠️'}
            hexColor={netColor}
          />
          <StatCard
            label="Transactions"
            value={String(transactions.length)}
            icon="🧾"
            hexColor="#6C63FF"
          />
        </View>

        {/* Monthly spending bar chart */}
        <View className="mx-5 mt-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-base font-bold text-gray-900 mb-1">6-Month Spending</Text>
          <Text className="text-xs text-gray-400 mb-3">Expense total per month</Text>
          <BarChart
            data={chartData}
            width={SCREEN_WIDTH - 72}
            height={180}
            yAxisLabel={sym}
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
              labelColor: () => '#6B7280',
              barPercentage: 0.6,
              propsForBackgroundLines: { strokeDasharray: '', stroke: '#F3F4F6' },
            }}
            style={{ borderRadius: 12 }}
            showValuesOnTopOfBars
            fromZero
          />
        </View>

        {/* Recent transactions */}
        <View className="px-5 mt-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-bold text-gray-900">Recent Transactions</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('MainTabs', { screen: 'Transactions' } as any)
              }
            >
              <Text className="text-sm text-primary font-semibold">See all →</Text>
            </TouchableOpacity>
          </View>

          {recent.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center border border-gray-100">
              <Text className="text-4xl mb-3">💰</Text>
              <Text className="text-gray-500 text-sm text-center">
                No transactions yet.{'\n'}Tap "+ Add" to get started!
              </Text>
            </View>
          ) : (
            recent.map((t) => {
              const meta = getCategoryMeta(t.category);
              const isIncome = t.type === 'income';
              const date = new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short', day: 'numeric',
              });
              return (
                <View
                  key={t.id}
                  className="flex-row items-center bg-white rounded-2xl px-4 py-3 mb-2 shadow-sm"
                  style={{
                    borderWidth: 1,
                    borderColor: isIncome ? '#D1FAF4' : '#F3F4F6',
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: meta.color + '22' }}
                  >
                    <Text className="text-xl">{meta.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Text className="text-xs text-gray-400">{t.category} · {date}</Text>
                  </View>
                  <Text
                    className="text-sm font-bold"
                    style={{ color: isIncome ? '#00C9A7' : '#374151' }}
                  >
                    {isIncome ? '+' : '-'}{fmt(t.amount)}
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
