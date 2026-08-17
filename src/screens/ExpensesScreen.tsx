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
import { Expense, RootStackParamList } from '../types';
import { CATEGORY_LABELS } from '../constants/categories';
import ExpenseCard from '../components/ExpenseCard';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ExpensesScreen() {
  const navigation = useNavigation<Nav>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
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

  const handleDelete = async (id: string) => {
    const updated = await deleteExpense(id);
    setExpenses(updated);
  };

  const handleEdit = (expense: Expense) => {
    navigation.navigate('EditExpense', { expense });
  };

  const filtered = expenses
    .filter((e) => {
      const matchCat = !selectedCat || e.category === selectedCat;
      const q = search.toLowerCase();
      const matchSearch =
        !q || e.title.toLowerCase().includes(q) || (e.description ?? '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-5 pt-4 pb-2 flex-row justify-between items-center">
        <Text className="text-2xl font-extrabold text-gray-900">Expenses 📋</Text>
        <TouchableOpacity
          className="bg-primary rounded-xl px-4 py-2"
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Text className="text-white font-bold text-sm">+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View className="mx-5 mt-2 flex-row items-center bg-white border border-gray-200 rounded-xl px-3">
        <Text className="text-gray-400 mr-2">🔍</Text>
        <TextInput
          className="flex-1 py-3 text-sm text-gray-900"
          placeholder="Search expenses…"
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

      {/* Category filter pills */}
      <FlatList
        horizontal
        data={['', ...CATEGORY_LABELS]}
        keyExtractor={(item) => item || 'all'}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-5 py-3 gap-2"
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedCat(item)}
            className={`px-4 py-1.5 rounded-full border ${
              selectedCat === item
                ? 'bg-primary border-primary'
                : 'bg-white border-gray-200'
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
      <View className="mx-5 mb-3 bg-primary/10 rounded-xl px-4 py-2 flex-row justify-between">
        <Text className="text-sm text-primary font-semibold">
          {filtered.length} expense{filtered.length !== 1 ? 's' : ''}
        </Text>
        <Text className="text-sm text-primary font-bold">Total: ${total.toFixed(2)}</Text>
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
            <Text className="text-5xl mb-4">🧾</Text>
            <Text className="text-gray-500 text-sm text-center">
              {search || selectedCat
                ? 'No expenses match your filters.'
                : 'No expenses yet.\nTap "+ Add" to record one!'}
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
