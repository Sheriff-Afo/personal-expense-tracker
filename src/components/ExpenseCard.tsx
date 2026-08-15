import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Transaction } from '../types';
import { getCategoryMeta } from '../constants/categories';

interface Props {
  expense: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseCard({ expense, onEdit, onDelete }: Props) {
  const meta = getCategoryMeta(expense.category);
  const isIncome = expense.type === 'income';

  const handleDelete = () => {
    Alert.alert(
      `Delete ${isIncome ? 'Income' : 'Expense'}`,
      `Delete "${expense.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(expense.id) },
      ],
    );
  };

  const formattedDate = new Date(expense.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const amountColor = isIncome ? '#00C9A7' : '#374151';
  const borderColor = isIncome ? '#D1FAF4' : '#F3F4F6';

  return (
    <View
      className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm"
      style={{ borderWidth: 1, borderColor }}
    >
      {/* Icon bubble */}
      <View
        className="w-12 h-12 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: meta.color + '22' }}
      >
        <Text className="text-2xl">{meta.icon}</Text>
      </View>

      {/* Info */}
      <View className="flex-1 mr-2">
        <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={1}>
          {expense.title}
        </Text>
        <View className="flex-row items-center gap-2 mb-1">
          {/* Type badge */}
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: isIncome ? '#D1FAF4' : '#FEE2E2' }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: isIncome ? '#00C9A7' : '#EF4444' }}
            >
              {isIncome ? '↑ Income' : '↓ Expense'}
            </Text>
          </View>
          {/* Category badge */}
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: meta.color + '20' }}
          >
            <Text className="text-xs font-semibold" style={{ color: meta.color }}>
              {expense.category}
            </Text>
          </View>
        </View>
        <Text className="text-xs text-gray-400">{formattedDate}</Text>
        {expense.description ? (
          <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
            {expense.description}
          </Text>
        ) : null}
      </View>

      {/* Amount + actions */}
      <View className="items-end">
        <Text className="text-lg font-bold mb-1" style={{ color: amountColor }}>
          {isIncome ? '+' : '-'}${expense.amount.toFixed(2)}
        </Text>
        <View className="flex-row gap-1">
          <TouchableOpacity
            onPress={() => onEdit(expense)}
            className="p-1"
            accessibilityLabel="Edit transaction"
          >
            <Text className="text-base">✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            className="p-1"
            accessibilityLabel="Delete transaction"
          >
            <Text className="text-base">🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
