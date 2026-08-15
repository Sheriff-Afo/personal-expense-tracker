import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { getCategoriesForType } from '../constants/categories';
import { CategoryMeta, TransactionType } from '../types';

interface Props {
  value: string;
  onChange: (category: string) => void;
  transactionType: TransactionType;
  error?: string;
}

export default function CategoryPicker({ value, onChange, transactionType, error }: Props) {
  const [open, setOpen] = useState(false);
  const categories: CategoryMeta[] = getCategoriesForType(transactionType);
  const selected = categories.find((c) => c.label === value);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className={`flex-row items-center bg-white border rounded-xl px-4 py-3 ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
        accessibilityLabel="Select category"
      >
        <Text className="text-xl mr-3">{selected?.icon ?? (transactionType === 'income' ? '💰' : '📦')}</Text>
        <Text className={`flex-1 text-base ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value || 'Select category…'}
        </Text>
        <Text className="text-gray-400">▾</Text>
      </TouchableOpacity>
      {error ? <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text> : null}

      <Modal visible={open} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <SafeAreaView className="bg-white rounded-t-3xl">
            <View className="px-5 pt-5 pb-3 border-b border-gray-100 flex-row justify-between items-center">
              <Text className="text-lg font-bold text-gray-900">
                {transactionType === 'income' ? '💰 Income Category' : '📦 Expense Category'}
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text className="text-gray-400 text-xl">✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.label}
              numColumns={2}
              contentContainerClassName="p-4"
              columnWrapperClassName="gap-3 mb-3"
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`flex-1 flex-row items-center rounded-xl p-3 border ${
                    value === item.label
                      ? 'border-primary bg-primary-light'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                  onPress={() => {
                    onChange(item.label);
                    setOpen(false);
                  }}
                >
                  <Text className="text-xl mr-2">{item.icon}</Text>
                  <Text
                    className={`flex-1 text-xs font-semibold ${
                      value === item.label ? 'text-primary' : 'text-gray-700'
                    }`}
                    numberOfLines={2}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}
