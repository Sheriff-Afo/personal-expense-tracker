import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { loadExpenses, deleteExpense } from '../storage/expenseStorage';
import { Transaction, TransactionType, RootStackParamList } from '../types';
import { EXPENSE_CATEGORY_LABELS, INCOME_CATEGORY_LABELS } from '../constants/categories';
import { useCurrency } from '../context/CurrencyContext';
import ExpenseCard from '../components/ExpenseCard';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TypeFilter = 'all' | TransactionType;

export default function TransactionsScreen() {
  const navigation = useNavigation<Nav>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedCat, setSelectedCat] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { fmt } = useCurrency();

  const load = useCallback(async () => {
    setTransactions(await loadExpenses());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = async (id: string) => {
    setTransactions(await deleteExpense(id));
  };

  const handleEdit = (transaction: Transaction) => {
    navigation.navigate('EditTransaction', { transaction });
  };

  // When typeFilter changes, reset category selection
  const setType = (t: TypeFilter) => {
    setTypeFilter(t);
    setSelectedCat('');
  };

  const categoryLabels =
    typeFilter === 'income'
      ? INCOME_CATEGORY_LABELS
      : typeFilter === 'expense'
      ? EXPENSE_CATEGORY_LABELS
      : [...INCOME_CATEGORY_LABELS, ...EXPENSE_CATEGORY_LABELS];

  const filtered = transactions
    .filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (selectedCat && t.category !== selectedCat) return false;
      const q = search.toLowerCase();
      return !q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome  = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  const typeButtons: { key: TypeFilter; label: string; icon: string }[] = [
    { key: 'all',     label: 'All',      icon: '📋' },
    { key: 'income',  label: 'Income',   icon: '💚' },
    { key: 'expense', label: 'Expenses', icon: '🔴' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-5 pt-4 pb-2 flex-row justify-between items-center">
        <Text className="text-2xl font-extrabold text-gray-900">Transactions 💳</Text>
        <TouchableOpacity
          className="bg-primary rounded-xl px-4 py-2"
          onPress={() => navigation.navigate('AddTransaction')}
        >
          <Text className="text-white font-bold text-sm">+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View className="mx-5 mt-2 flex-row items-center bg-white border border-gray-200 rounded-xl px-3">
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

      {/* Type filter */}
      <View className="flex-row gap-2 px-5 mt-3">
        {typeButtons.map(({ key, label, icon }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setType(key)}
            className={`flex-1 flex-row items-center justify-center py-2 rounded-xl border gap-1 ${
              typeFilter === key ? 'bg-primary border-primary' : 'bg-white border-gray-200'
            }`}
          >
            <Text className="text-sm">{icon}</Text>
            <Text
              className={`text-xs font-bold ${
                typeFilter === key ? 'text-white' : 'text-gray-600'
              }`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category filter pills */}
      <FlatList
        horizontal
        data={['', ...categoryLabels]}
        keyExtractor={(item) => item || 'all'}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-5 py-3 gap-2"
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedCat(item)}
            className={`px-4 py-1.5 rounded-full border ${
              selectedCat === item ? 'bg-primary border-primary' : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedCat === item ? 'text-white' : 'text-gray-600'
              }`}
            >
              {item || 'All'}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Summary bar */}
      <View className="mx-5 mb-3 bg-white rounded-xl px-4 py-3 border border-gray-100">
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-gray-400">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</Text>
          <Text
            className="text-sm font-bold"
            style={{ color: net >= 0 ? '#00C9A7' : '#FF6B6B' }}
          >
            Net: {net >= 0 ? '+' : '-'}{fmt(Math.abs(net))}
          </Text>
        </View>
        {(totalIncome > 0 || totalExpense > 0) && (
          <View className="flex-row justify-between mt-1.5">
            <Text className="text-xs text-success font-semibold">+{fmt(totalIncome)} income</Text>
            <Text className="text-xs text-danger font-semibold">-{fmt(totalExpense)} expenses</Text>
          </View>
        )}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-5xl mb-4">💳</Text>
            <Text className="text-gray-500 text-sm text-center">
              {search || selectedCat || typeFilter !== 'all'
                ? 'No transactions match your filters.'
                : 'No transactions yet.\nTap "+ Add" to record one!'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ExpenseCard expense={item} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      />
    </SafeAreaView>
  );
}
