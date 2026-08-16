/**
 * AnalyticsScreen
 * ─────────────────────────────────────────────────────────────────────────────
 * Two modes toggled by a segmented control at the top:
 *
 *   Overview — all-time aggregated analytics (income/expense/category charts)
 *   Annual   — year-scoped breakdown with a year picker (← 2025 →), monthly
 *              trend chart, month-by-month table, highlights, and category
 *              totals scoped to the selected year.
 */

import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { loadExpenses } from '../storage/expenseStorage';
import { Transaction } from '../types';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCategoryMeta,
} from '../constants/categories';
import { useCurrency } from '../context/CurrencyContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 72;

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Rolling 6-month data used by the Overview tab. */
function get6MonthData(transactions: Transaction[]) {
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
    return { label, income: +income.toFixed(2), expense: +expense.toFixed(2) };
  });
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface MonthStat {
  label: string;
  month: number;
  income: number;
  expense: number;
  net: number;
  count: number;
}

/** Full 12-month breakdown for a given year. */
function getAnnualMonths(transactions: Transaction[], year: number): MonthStat[] {
  return MONTH_LABELS.map((label, i) => {
    const inMonth = transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getFullYear() === year && td.getMonth() === i;
    });
    const income  = +inMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0).toFixed(2);
    const expense = +inMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toFixed(2);
    return { label, month: i, income, expense, net: +(income - expense).toFixed(2), count: inMonth.length };
  });
}

/** Sorted list of unique years that appear in transactions, always includes current year. */
function getAvailableYears(transactions: Transaction[]): number[] {
  const years = new Set<number>([new Date().getFullYear()]);
  transactions.forEach((t) => years.add(new Date(t.date).getFullYear()));
  return Array.from(years).sort((a, b) => a - b);
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function EmptyChart({ text }: { text: string }) {
  return (
    <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#9CA3AF', fontSize: 13 }}>{text}</Text>
    </View>
  );
}

function SummaryCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
      <Text className="text-xs text-gray-400 mb-1 text-center">{label}</Text>
      <Text
        className="text-base font-extrabold text-center"
        style={{ color: valueColor ?? '#111827' }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

function CategoryBar({
  cat,
  amt,
  total,
  fmt,
}: {
  cat: string;
  amt: number;
  total: number;
  fmt: (n: number, d?: number) => string;
}) {
  const meta = getCategoryMeta(cat);
  const pct  = total > 0 ? (amt / total) * 100 : 0;
  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-2" style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ fontSize: 16 }}>{meta.icon}</Text>
          <Text className="text-sm font-medium text-gray-800" numberOfLines={1} style={{ flex: 1 }}>
            {cat}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-gray-400">{pct.toFixed(1)}%</Text>
          <Text className="text-sm font-bold text-gray-900">{fmt(amt)}</Text>
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
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing]     = useState(false);
  const [mode, setMode]                 = useState<'overview' | 'annual'>('overview');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { sym, fmt } = useCurrency();

  const load = useCallback(async () => {
    setTransactions(await loadExpenses());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // ── Overview derived values ─────────────────────────────────────────────────
  const expenses = transactions.filter((t) => t.type === 'expense');
  const incomes  = transactions.filter((t) => t.type === 'income');

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome  = incomes.reduce((s, t) => s + t.amount, 0);
  const netBalance   = totalIncome - totalExpense;
  const savingsRate  = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const monthly6     = get6MonthData(transactions);
  const dualLineData = {
    labels: monthly6.map((m) => m.label),
    datasets: [
      { data: monthly6.map((m) => Math.max(m.income, 0)),  color: (o = 1) => `rgba(0,201,167,${o})`,  strokeWidth: 2 },
      { data: monthly6.map((m) => Math.max(m.expense, 0)), color: (o = 1) => `rgba(255,107,107,${o})`, strokeWidth: 2 },
    ],
    legend: ['Income', 'Expenses'],
  };

  const expCatMap: Record<string, number> = {};
  expenses.forEach((t) => { expCatMap[t.category] = (expCatMap[t.category] ?? 0) + t.amount; });
  const sortedExpCats = Object.entries(expCatMap).sort((a, b) => b[1] - a[1]);

  const incCatMap: Record<string, number> = {};
  incomes.forEach((t) => { incCatMap[t.category] = (incCatMap[t.category] ?? 0) + t.amount; });
  const sortedIncCats = Object.entries(incCatMap).sort((a, b) => b[1] - a[1]);

  const expPieData = EXPENSE_CATEGORIES
    .filter((c) => expCatMap[c.label])
    .map((c) => ({ name: c.label.split(' ')[0], population: expCatMap[c.label], color: c.color, legendFontColor: '#6B7280', legendFontSize: 10 }))
    .slice(0, 7);

  const incPieData = INCOME_CATEGORIES
    .filter((c) => incCatMap[c.label])
    .map((c) => ({ name: c.label.split(' ')[0], population: incCatMap[c.label], color: c.color, legendFontColor: '#6B7280', legendFontSize: 10 }))
    .slice(0, 7);

  const highest   = expenses.length ? expenses.reduce((m, t) => (t.amount > m.amount ? t : m), expenses[0]) : null;
  const avgExpense = expenses.length ? totalExpense / expenses.length : 0;

  // ── Annual derived values ───────────────────────────────────────────────────
  const availableYears = getAvailableYears(transactions);
  const yearIdx        = availableYears.indexOf(selectedYear);
  const canGoBack      = yearIdx > 0;
  const canGoForward   = yearIdx < availableYears.length - 1;

  const annualMonths  = getAnnualMonths(transactions, selectedYear);
  const activeMonths  = annualMonths.filter((m) => m.count > 0);

  const annualIncome  = annualMonths.reduce((s, m) => s + m.income, 0);
  const annualExpense = annualMonths.reduce((s, m) => s + m.expense, 0);
  const annualNet     = +(annualIncome - annualExpense).toFixed(2);
  const annualSavingsRate = annualIncome > 0 ? ((annualIncome - annualExpense) / annualIncome) * 100 : 0;
  const annualTxCount = annualMonths.reduce((s, m) => s + m.count, 0);

  const avgMonthlyIncome  = activeMonths.length > 0 ? annualIncome  / activeMonths.length : 0;
  const avgMonthlyExpense = activeMonths.length > 0 ? annualExpense / activeMonths.length : 0;
  const surplusMonths     = activeMonths.filter((m) => m.net >= 0).length;
  const deficitMonths     = activeMonths.filter((m) => m.net < 0).length;

  const bestSavingsMonth   = activeMonths.length > 0 ? activeMonths.reduce((b, m) => (m.net   > b.net   ? m : b), activeMonths[0]) : null;
  const highestSpendMonth  = activeMonths.length > 0 ? activeMonths.reduce((b, m) => (m.expense > b.expense ? m : b), activeMonths[0]) : null;
  const highestIncomeMonth = activeMonths.length > 0 ? activeMonths.reduce((b, m) => (m.income  > b.income  ? m : b), activeMonths[0]) : null;

  const yearExpenses      = transactions.filter((t) => t.type === 'expense' && new Date(t.date).getFullYear() === selectedYear);
  const annualExpCatMap: Record<string, number> = {};
  yearExpenses.forEach((t) => { annualExpCatMap[t.category] = (annualExpCatMap[t.category] ?? 0) + t.amount; });
  const sortedAnnualExpCats = Object.entries(annualExpCatMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const yearIncomes       = transactions.filter((t) => t.type === 'income' && new Date(t.date).getFullYear() === selectedYear);
  const annualIncCatMap: Record<string, number> = {};
  yearIncomes.forEach((t) => { annualIncCatMap[t.category] = (annualIncCatMap[t.category] ?? 0) + t.amount; });
  const sortedAnnualIncCats = Object.entries(annualIncCatMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // 12-month chart — use a wider canvas and let users scroll horizontally
  const ANNUAL_CHART_WIDTH = Math.max(CHART_WIDTH, 580);
  // Ensure no dataset is all-zeroes (chart-kit can choke on that)
  const safeAnnualChartData = {
    labels: MONTH_LABELS,
    datasets: [
      {
        data: annualMonths.map((m) => Math.max(m.income, 0)),
        color: (o = 1) => `rgba(0,201,167,${o})`,
        strokeWidth: 2,
      },
      {
        data: annualMonths.map((m) => Math.max(m.expense, 0)),
        color: (o = 1) => `rgba(255,107,107,${o})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Income', 'Expenses'],
  };

  // Max absolute net for the month-bar scale
  const maxAbsNet = activeMonths.length > 0
    ? Math.max(...activeMonths.map((m) => Math.abs(m.net)), 1)
    : 1;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── Header ── */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-2xl font-extrabold text-gray-900">Analytics 📈</Text>
          <Text className="text-sm text-gray-500 mt-0.5">Your financial insights</Text>
        </View>

        {/* ── Mode toggle ── */}
        <View className="mx-5 mt-2 mb-4 flex-row bg-gray-100 rounded-xl p-1">
          {(['overview', 'annual'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              className="flex-1 py-2.5 rounded-lg items-center"
              style={mode === m ? { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 } : undefined}
            >
              <Text
                className="text-sm font-bold"
                style={{ color: mode === m ? '#6C63FF' : '#9CA3AF' }}
              >
                {m === 'overview' ? '📊 Overview' : '📅 Annual'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            OVERVIEW TAB
            ════════════════════════════════════════════════════════════════ */}
        {mode === 'overview' && (
          <>
            {/* Top summary row */}
            <View className="flex-row gap-3 px-5 mb-3">
              <SummaryCard label="Total Income"  value={`+${fmt(totalIncome,  0)}`} valueColor="#00C9A7" />
              <SummaryCard label="Total Spent"   value={`-${fmt(totalExpense, 0)}`} valueColor="#FF6B6B" />
            </View>
            <View className="flex-row gap-3 px-5 mb-5">
              <SummaryCard
                label="Net Balance"
                value={`${netBalance >= 0 ? '+' : '-'}${fmt(Math.abs(netBalance), 0)}`}
                valueColor={netBalance >= 0 ? '#00C9A7' : '#FF6B6B'}
              />
              <SummaryCard
                label="Savings Rate"
                value={`${savingsRate.toFixed(1)}%`}
                valueColor={savingsRate >= 0 ? '#00C9A7' : '#FF6B6B'}
              />
            </View>

            {/* 6-month dual-line chart */}
            <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <Text className="text-base font-bold text-gray-900 mb-1">Income vs Expenses</Text>
              <Text className="text-xs text-gray-400 mb-3">6-month trend</Text>
              {transactions.length > 0 ? (
                <>
                  <LineChart
                    data={dualLineData}
                    width={CHART_WIDTH}
                    height={200}
                    yAxisLabel={sym}
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: '#fff',
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      decimalPlaces: 0,
                      color: (o = 1) => `rgba(108,99,255,${o})`,
                      labelColor: () => '#6B7280',
                      propsForDots: { r: '4', strokeWidth: '2' },
                      propsForBackgroundLines: { strokeDasharray: '', stroke: '#F3F4F6' },
                    }}
                    bezier
                    style={{ borderRadius: 12 }}
                    withShadow={false}
                  />
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

            {/* Expense pie */}
            {expPieData.length > 0 && (
              <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <Text className="text-base font-bold text-gray-900 mb-3">🔴 Spending by Category</Text>
                <PieChart
                  data={expPieData}
                  width={CHART_WIDTH}
                  height={180}
                  chartConfig={{ color: (o = 1) => `rgba(0,0,0,${o})` }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="10"
                  absolute={false}
                />
              </View>
            )}

            {/* Income pie */}
            {incPieData.length > 0 && (
              <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <Text className="text-base font-bold text-gray-900 mb-3">💚 Income by Source</Text>
                <PieChart
                  data={incPieData}
                  width={CHART_WIDTH}
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
                {sortedExpCats.map(([cat, amt]) => (
                  <CategoryBar key={cat} cat={cat} amt={amt} total={totalExpense} fmt={fmt} />
                ))}
              </View>
            )}

            {/* Income sources breakdown */}
            {sortedIncCats.length > 0 && (
              <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <Text className="text-base font-bold text-gray-900 mb-3">Income Sources</Text>
                {sortedIncCats.map(([cat, amt]) => {
                  const meta = getCategoryMeta(cat);
                  const pct  = totalIncome > 0 ? (amt / totalIncome) * 100 : 0;
                  return (
                    <View key={cat} className="mb-3">
                      <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center gap-2">
                          <Text style={{ fontSize: 16 }}>{meta.icon}</Text>
                          <Text className="text-sm font-medium text-gray-800">{cat}</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Text className="text-xs text-gray-400">{pct.toFixed(1)}%</Text>
                          <Text className="text-sm font-bold text-success">{fmt(amt)}</Text>
                        </View>
                      </View>
                      <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Quick stats */}
            <View className="flex-row gap-3 px-5 mb-5">
              <SummaryCard label="Avg / Expense"    value={fmt(avgExpense, 0)}         valueColor="#6C63FF" />
              <SummaryCard label="All Transactions" value={String(transactions.length)} valueColor="#F59E0B" />
            </View>

            {/* Largest single expense */}
            {highest && (
              <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <Text className="text-base font-bold text-gray-900 mb-3">🏆 Largest Expense</Text>
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: getCategoryMeta(highest.category).color + '22' }}
                  >
                    <Text style={{ fontSize: 22 }}>{getCategoryMeta(highest.category).icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>{highest.title}</Text>
                    <Text className="text-xs text-gray-500">{highest.category} · {highest.date}</Text>
                  </View>
                  <Text className="text-lg font-extrabold text-danger">{fmt(highest.amount)}</Text>
                </View>
              </View>
            )}

            {transactions.length === 0 && (
              <View className="mx-5 bg-white rounded-2xl p-10 border border-gray-100 items-center">
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
                <Text className="text-gray-500 text-sm text-center">
                  No transactions yet.{'\n'}Add income and expenses to see your analytics!
                </Text>
              </View>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            ANNUAL TAB
            ════════════════════════════════════════════════════════════════ */}
        {mode === 'annual' && (
          <>
            {/* ── Year picker ── */}
            <View className="flex-row items-center justify-center mb-5 gap-5">
              <TouchableOpacity
                onPress={() => canGoBack && setSelectedYear(availableYears[yearIdx - 1])}
                disabled={!canGoBack}
                style={{
                  opacity: canGoBack ? 1 : 0.25,
                  width: 44, height: 44,
                  borderRadius: 22,
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20, color: '#6C63FF', fontWeight: '700' }}>←</Text>
              </TouchableOpacity>

              <View className="items-center">
                <Text className="text-3xl font-extrabold text-gray-900">{selectedYear}</Text>
                {annualTxCount > 0 && (
                  <Text className="text-xs text-gray-400 mt-0.5">{annualTxCount} transactions</Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => canGoForward && setSelectedYear(availableYears[yearIdx + 1])}
                disabled={!canGoForward}
                style={{
                  opacity: canGoForward ? 1 : 0.25,
                  width: 44, height: 44,
                  borderRadius: 22,
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20, color: '#6C63FF', fontWeight: '700' }}>→</Text>
              </TouchableOpacity>
            </View>

            {annualTxCount === 0 ? (
              /* ── Empty year ── */
              <View className="mx-5 bg-white rounded-2xl p-10 border border-gray-100 items-center">
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📅</Text>
                <Text className="text-gray-500 text-sm text-center">
                  No transactions in {selectedYear}.{'\n'}
                  Add income or expenses to build your annual report!
                </Text>
              </View>
            ) : (
              <>
                {/* ── 4-card summary ── */}
                <View className="flex-row gap-3 px-5 mb-3">
                  <SummaryCard
                    label="Annual Income"
                    value={`+${fmt(annualIncome, 0)}`}
                    valueColor="#00C9A7"
                  />
                  <SummaryCard
                    label="Annual Expenses"
                    value={`-${fmt(annualExpense, 0)}`}
                    valueColor="#FF6B6B"
                  />
                </View>
                <View className="flex-row gap-3 px-5 mb-5">
                  <SummaryCard
                    label="Net Balance"
                    value={`${annualNet >= 0 ? '+' : '-'}${fmt(Math.abs(annualNet), 0)}`}
                    valueColor={annualNet >= 0 ? '#00C9A7' : '#FF6B6B'}
                  />
                  <SummaryCard
                    label="Savings Rate"
                    value={`${annualSavingsRate.toFixed(1)}%`}
                    valueColor={annualSavingsRate >= 0 ? '#00C9A7' : '#FF6B6B'}
                  />
                </View>

                {/* ── 12-month dual-line chart (scrollable) ── */}
                <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <Text className="text-base font-bold text-gray-900 mb-1">Monthly Trend</Text>
                  <Text className="text-xs text-gray-400 mb-3">
                    Income vs Expenses — {selectedYear} · Scroll to see all months →
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
                    <LineChart
                      data={safeAnnualChartData}
                      width={ANNUAL_CHART_WIDTH}
                      height={210}
                      yAxisLabel={sym}
                      yAxisSuffix=""
                      chartConfig={{
                        backgroundColor: '#fff',
                        backgroundGradientFrom: '#fff',
                        backgroundGradientTo: '#fff',
                        decimalPlaces: 0,
                        color: (o = 1) => `rgba(108,99,255,${o})`,
                        labelColor: () => '#6B7280',
                        propsForDots: { r: '3', strokeWidth: '2' },
                        propsForBackgroundLines: { strokeDasharray: '', stroke: '#F3F4F6' },
                      }}
                      bezier
                      style={{ borderRadius: 12 }}
                      withShadow={false}
                    />
                  </ScrollView>
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
                </View>

                {/* ── Quick stats row ── */}
                <View className="flex-row gap-3 px-5 mb-3">
                  <SummaryCard label="Avg Income / Mo"  value={fmt(avgMonthlyIncome,  0)} valueColor="#00C9A7" />
                  <SummaryCard label="Avg Expense / Mo" value={fmt(avgMonthlyExpense, 0)} valueColor="#FF6B6B" />
                </View>
                <View className="flex-row gap-3 px-5 mb-5">
                  <SummaryCard label="Surplus Months" value={String(surplusMonths)} valueColor="#00C9A7" />
                  <SummaryCard label="Deficit Months" value={String(deficitMonths)} valueColor="#FF6B6B" />
                </View>

                {/* ── Year Highlights ── */}
                <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <Text className="text-base font-bold text-gray-900 mb-3">✨ Year Highlights</Text>

                  {bestSavingsMonth && (
                    <View
                      className="flex-row items-center mb-3 pb-3"
                      style={{ borderBottomWidth: 1, borderBottomColor: '#F9FAFB' }}
                    >
                      <Text style={{ fontSize: 24, marginRight: 12 }}>🏆</Text>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-gray-800">Best Savings Month</Text>
                        <Text className="text-xs text-gray-400">
                          {bestSavingsMonth.label} · {bestSavingsMonth.count} transactions
                        </Text>
                      </View>
                      <Text
                        className="text-sm font-bold"
                        style={{ color: bestSavingsMonth.net >= 0 ? '#00C9A7' : '#FF6B6B' }}
                      >
                        {bestSavingsMonth.net >= 0 ? '+' : ''}{fmt(bestSavingsMonth.net, 0)}
                      </Text>
                    </View>
                  )}

                  {highestIncomeMonth && (
                    <View
                      className="flex-row items-center mb-3 pb-3"
                      style={{ borderBottomWidth: 1, borderBottomColor: '#F9FAFB' }}
                    >
                      <Text style={{ fontSize: 24, marginRight: 12 }}>📈</Text>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-gray-800">Best Income Month</Text>
                        <Text className="text-xs text-gray-400">
                          {highestIncomeMonth.label} · {fmt(highestIncomeMonth.income, 0)} earned
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-success">
                        +{fmt(highestIncomeMonth.income, 0)}
                      </Text>
                    </View>
                  )}

                  {highestSpendMonth && (
                    <View className="flex-row items-center">
                      <Text style={{ fontSize: 24, marginRight: 12 }}>💸</Text>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-gray-800">Highest Spending Month</Text>
                        <Text className="text-xs text-gray-400">
                          {highestSpendMonth.label} · {fmt(highestSpendMonth.expense, 0)} spent
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-danger">
                        -{fmt(highestSpendMonth.expense, 0)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* ── Month-by-month breakdown ── */}
                <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <Text className="text-base font-bold text-gray-900 mb-3">Month-by-Month</Text>

                  {/* Column headers */}
                  <View className="flex-row items-center mb-2 pb-1" style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                    <Text className="text-xs text-gray-400 w-10">Month</Text>
                    <Text className="text-xs text-gray-400 flex-1 text-right">Income</Text>
                    <Text className="text-xs text-gray-400 w-20 text-right">Expenses</Text>
                    <Text className="text-xs text-gray-400 w-20 text-right">Net</Text>
                  </View>

                  {annualMonths.map((m) => {
                    const isActive = m.count > 0;
                    return (
                      <View key={m.label}>
                        <View className="flex-row items-center py-2">
                          <Text
                            className="text-xs font-semibold w-10"
                            style={{ color: isActive ? '#374151' : '#D1D5DB' }}
                          >
                            {m.label}
                          </Text>
                          <Text
                            className="flex-1 text-xs text-right"
                            style={{ color: isActive && m.income > 0 ? '#00C9A7' : '#D1D5DB' }}
                          >
                            {isActive && m.income > 0 ? `+${fmt(m.income, 0)}` : '—'}
                          </Text>
                          <Text
                            className="w-20 text-xs text-right"
                            style={{ color: isActive && m.expense > 0 ? '#FF6B6B' : '#D1D5DB' }}
                          >
                            {isActive && m.expense > 0 ? `-${fmt(m.expense, 0)}` : '—'}
                          </Text>
                          <Text
                            className="w-20 text-xs font-bold text-right"
                            style={{ color: isActive ? (m.net >= 0 ? '#00C9A7' : '#FF6B6B') : '#D1D5DB' }}
                          >
                            {isActive ? `${m.net >= 0 ? '+' : ''}${fmt(m.net, 0)}` : '—'}
                          </Text>
                        </View>
                        {/* Net indicator bar — only for active months */}
                        {isActive && (
                          <View className="h-1 bg-gray-50 rounded-full overflow-hidden mb-1">
                            <View
                              style={{
                                height: '100%',
                                width: `${Math.round((Math.abs(m.net) / maxAbsNet) * 100)}%`,
                                backgroundColor: m.net >= 0 ? '#00C9A7' : '#FF6B6B',
                                borderRadius: 999,
                              }}
                            />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* ── Top expense categories ── */}
                {sortedAnnualExpCats.length > 0 && (
                  <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <Text className="text-base font-bold text-gray-900 mb-3">
                      🔴 Top Spending — {selectedYear}
                    </Text>
                    {sortedAnnualExpCats.map(([cat, amt]) => (
                      <CategoryBar key={cat} cat={cat} amt={amt} total={annualExpense} fmt={fmt} />
                    ))}
                  </View>
                )}

                {/* ── Top income sources ── */}
                {sortedAnnualIncCats.length > 0 && (
                  <View className="mx-5 mb-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <Text className="text-base font-bold text-gray-900 mb-3">
                      💚 Income Sources — {selectedYear}
                    </Text>
                    {sortedAnnualIncCats.map(([cat, amt]) => {
                      const meta = getCategoryMeta(cat);
                      const pct  = annualIncome > 0 ? (amt / annualIncome) * 100 : 0;
                      return (
                        <View key={cat} className="mb-3">
                          <View className="flex-row items-center justify-between mb-1">
                            <View className="flex-row items-center gap-2" style={{ flex: 1, marginRight: 8 }}>
                              <Text style={{ fontSize: 16 }}>{meta.icon}</Text>
                              <Text className="text-sm font-medium text-gray-800" numberOfLines={1} style={{ flex: 1 }}>
                                {cat}
                              </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                              <Text className="text-xs text-gray-400">{pct.toFixed(1)}%</Text>
                              <Text className="text-sm font-bold text-success">{fmt(amt)}</Text>
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
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
