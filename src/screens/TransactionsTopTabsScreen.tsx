/**
 * TransactionsTopTabsScreen
 * ─────────────────────────────────────────────────────────────────────────────
 * Material Top Tabs version of the Transactions screen.
 * Switched in/out via FLAGS.USE_MATERIAL_TOP_TABS_FOR_TRANSACTIONS in
 * src/config/featureFlags.ts — flip that boolean, nothing else changes.
 *
 * Architecture:
 *  ┌─ SafeAreaView ────────────────────────────────────────┐
 *  │  Header (title + "+ Add" button)                      │
 *  │  Search bar  ←── shared state (FilterContext)         │
 *  │  ┌─ Material Top Tabs ──────────────────────────────┐ │
 *  │  │  [📋 All]  [💚 Income]  [🔴 Expenses]           │ │
 *  │  │  ┌─ TransactionList ─────────────────────────┐  │ │
 *  │  │  │  Summary bar                              │  │ │
 *  │  │  │  FlatList of ExpenseCards                 │  │ │
 *  │  │  └───────────────────────────────────────────┘  │ │
 *  │  └──────────────────────────────────────────────────┘ │
 *  └───────────────────────────────────────────────────────┘
 *
 * Shared state is provided via FilterContext so all three tab components
 * react to the same search query and transaction list without prop-drilling
 * through the navigator.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { loadExpenses, deleteExpense } from '../storage/expenseStorage';
import { Transaction, TransactionType, RootStackParamList } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import ExpenseCard from '../components/ExpenseCard';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Shared context ──────────────────────────────────────────────────────────
// All three tabs read from this — avoids duplicating load/state logic per tab.
interface FilterCtx {
  transactions: Transaction[];
  search: string;
  refreshing: boolean;
  onRefresh: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  fmt: (n: number, decimals?: number) => string;
}

const FilterContext = createContext<FilterCtx>({} as FilterCtx);

// ─── Reusable list component shared by all three tabs ────────────────────────
function TransactionList({ type }: { type: 'all' | TransactionType }) {
  const { transactions, search, refreshing, onRefresh, onEdit, onDelete, fmt } =
    useContext(FilterContext);

  const filtered = transactions
    .filter((t) => {
      if (type !== 'all' && t.type !== type) return false;
      const q = search.toLowerCase();
      return (
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  const emptyMessage =
    search
      ? 'No transactions match your search.'
      : type === 'income'
      ? 'No income recorded yet.\nTap "+ Add" to log some!'
      : type === 'expense'
      ? 'No expenses recorded yet.\nTap "+ Add" to log one!'
      : 'No transactions yet.\nTap "+ Add" to record one!';

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        filtered.length > 0 ? (
          <View className="bg-white rounded-xl px-4 py-3 border border-gray-100 mb-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-gray-400">
                {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
              </Text>
              <Text
                className="text-sm font-bold"
                style={{ color: net >= 0 ? '#00C9A7' : '#FF6B6B' }}
              >
                Net: {net >= 0 ? '+' : '-'}{fmt(Math.abs(net))}
              </Text>
            </View>
            {(totalIncome > 0 || totalExpense > 0) && (
              <View className="flex-row justify-between mt-1.5">
                <Text className="text-xs text-success font-semibold">
                  +{fmt(totalIncome)} income
                </Text>
                <Text className="text-xs text-danger font-semibold">
                  -{fmt(totalExpense)} expenses
                </Text>
              </View>
            )}
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View className="items-center py-16">
          <Text className="text-5xl mb-4">💳</Text>
          <Text className="text-gray-500 text-sm text-center">{emptyMessage}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <ExpenseCard expense={item} onEdit={onEdit} onDelete={onDelete} />
      )}
    />
  );
}

// ─── Individual tab components ────────────────────────────────────────────────
// Each is a one-liner — all logic lives in TransactionList above.
const AllTab      = () => <TransactionList type="all" />;
const IncomeTab   = () => <TransactionList type="income" />;
const ExpensesTab = () => <TransactionList type="expense" />;

// ─── Top Tab Navigator instance ───────────────────────────────────────────────
const TopTabs = createMaterialTopTabNavigator();

// ─── Root screen (mounts the navigator + provides shared context) ─────────────
export default function TransactionsTopTabsScreen() {
  const navigation = useNavigation<Nav>();
  const { fmt } = useCurrency();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setTransactions(await loadExpenses());
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

  const onDelete = async (id: string) => {
    setTransactions(await deleteExpense(id));
  };

  const onEdit = (transaction: Transaction) => {
    navigation.navigate('EditTransaction', { transaction });
  };

  return (
    <FilterContext.Provider
      value={{ transactions, search, refreshing, onRefresh, onEdit, onDelete, fmt }}
    >
      <SafeAreaView className="flex-1 bg-surface">
        {/* ── Header ── */}
        <View className="px-5 pt-4 pb-2 flex-row justify-between items-center">
          <Text className="text-2xl font-extrabold text-gray-900">
            Transactions 💳
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-xl px-4 py-2"
            onPress={() => navigation.navigate('AddTransaction')}
          >
            <Text className="text-white font-bold text-sm">+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search bar (shared across all tabs) ── */}
        <View className="mx-5 mt-2 mb-3 flex-row items-center bg-white border border-gray-200 rounded-xl px-3">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 py-3 text-sm text-gray-900"
            placeholder="Search transactions…"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text className="text-gray-400 text-lg px-1">✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Material Top Tabs ── */}
        <TopTabs.Navigator
          screenOptions={{
            // Active tab text + indicator colour — matches app's primary purple
            tabBarActiveTintColor: '#6C63FF',
            tabBarInactiveTintColor: '#9CA3AF',
            // The sliding underline indicator
            tabBarIndicatorStyle: {
              backgroundColor: '#6C63FF',
              height: 3,
              borderRadius: 2,
            },
            // Tab bar background + border instead of shadow
            tabBarStyle: {
              backgroundColor: '#ffffff',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
            },
            // Label typography — "none" prevents ALL-CAPS default
            tabBarLabelStyle: {
              fontSize: 13,
              fontWeight: '700',
              textTransform: 'none',
            },
            // Only render a tab when it's first visited (saves memory)
            lazy: true,
          }}
        >
          <TopTabs.Screen
            name="All"
            component={AllTab}
            options={{ tabBarLabel: '📋  All' }}
          />
          <TopTabs.Screen
            name="Income"
            component={IncomeTab}
            options={{ tabBarLabel: '💚  Income' }}
          />
          <TopTabs.Screen
            name="Expenses"
            component={ExpensesTab}
            options={{ tabBarLabel: '🔴  Expenses' }}
          />
        </TopTabs.Navigator>
      </SafeAreaView>
    </FilterContext.Provider>
  );
}
