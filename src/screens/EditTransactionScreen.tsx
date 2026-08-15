import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { updateExpense } from '../storage/expenseStorage';
import { TransactionType, RootStackParamList } from '../types';
import CategoryPicker from '../components/CategoryPicker';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EditTransaction'>;

interface FormErrors {
  title?: string;
  amount?: string;
  category?: string;
  date?: string;
}

export default function EditTransactionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { transaction } = route.params;

  const [txType, setTxType] = useState<TransactionType>(transaction.type);
  const [title, setTitle] = useState(transaction.title);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [category, setCategory] = useState(transaction.category);
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Reset category when switching type
  const handleTypeChange = (type: TransactionType) => {
    if (type !== txType) {
      setTxType(type);
      setCategory('');
      setErrors((e) => ({ ...e, category: undefined }));
    }
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (!amount.trim()) {
      errs.amount = 'Amount is required.';
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      errs.amount = 'Enter a valid amount greater than 0.';
    }
    if (!category) errs.category = 'Please select a category.';
    if (!date) {
      errs.date = 'Date is required.';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errs.date = 'Use format YYYY-MM-DD.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateExpense(transaction.id, {
        type: txType,
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date,
        description: description.trim() || undefined,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to update transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isIncome = txType === 'income';
  const accentColor = isIncome ? '#00C9A7' : '#6C63FF';
  const accentBg    = isIncome ? '#D1FAF4' : '#EEF0FF';

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pt-4 pb-4">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
              <Text className="text-primary text-base font-semibold">← Back</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">Edit Transaction</Text>
            <View className="w-16" />
          </View>

          {/* Income / Expense toggle */}
          <View className="flex-row bg-white rounded-2xl border border-gray-200 p-1 mb-2">
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2"
              style={txType === 'expense' ? { backgroundColor: '#EEF0FF' } : {}}
              onPress={() => handleTypeChange('expense')}
            >
              <Text className="text-lg">🔴</Text>
              <Text
                className="font-bold text-sm"
                style={{ color: txType === 'expense' ? '#6C63FF' : '#9CA3AF' }}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2"
              style={txType === 'income' ? { backgroundColor: '#D1FAF4' } : {}}
              onPress={() => handleTypeChange('income')}
            >
              <Text className="text-lg">💚</Text>
              <Text
                className="font-bold text-sm"
                style={{ color: txType === 'income' ? '#00C9A7' : '#9CA3AF' }}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Label text="Title *" />
          <TextInput
            className={`bg-white border rounded-xl px-4 py-3 text-base text-gray-900 mb-1 ${
              errors.title ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder={isIncome ? 'e.g. Monthly Salary' : 'e.g. Coffee at Starbucks'}
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={(t) => { setTitle(t); setErrors((e) => ({ ...e, title: undefined })); }}
          />
          {errors.title ? <ErrorText text={errors.title} /> : null}

          {/* Amount */}
          <Label text="Amount ($) *" />
          <TextInput
            className={`bg-white border rounded-xl px-4 py-3 text-base text-gray-900 mb-1 ${
              errors.amount ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            value={amount}
            onChangeText={(t) => { setAmount(t); setErrors((e) => ({ ...e, amount: undefined })); }}
            keyboardType="decimal-pad"
          />
          {errors.amount ? <ErrorText text={errors.amount} /> : null}

          {/* Category */}
          <Label text="Category *" />
          <View className="mb-1">
            <CategoryPicker
              value={category}
              onChange={(c) => { setCategory(c); setErrors((e) => ({ ...e, category: undefined })); }}
              transactionType={txType}
              error={errors.category}
            />
          </View>

          {/* Date */}
          <Label text="Date *" />
          <TextInput
            className={`bg-white border rounded-xl px-4 py-3 text-base text-gray-900 mb-1 ${
              errors.date ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
            value={date}
            onChangeText={(t) => { setDate(t); setErrors((e) => ({ ...e, date: undefined })); }}
            keyboardType="numeric"
          />
          {errors.date ? <ErrorText text={errors.date} /> : null}

          {/* Description */}
          <Label text="Description (optional)" />
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-6"
            placeholder="Add a note…"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 80 }}
          />

          {/* Save button */}
          <TouchableOpacity
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: saving ? accentColor + '99' : accentColor }}
            onPress={handleSave}
            disabled={saving}
          >
            <Text className="text-white font-bold text-base">
              {saving ? 'Saving…' : isIncome ? '✓ Update Income' : '✓ Update Expense'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text className="text-sm font-semibold text-gray-700 mb-1.5 mt-4">{text}</Text>;
}

function ErrorText({ text }: { text: string }) {
  return <Text className="text-red-500 text-xs mt-0.5 ml-1 mb-1">{text}</Text>;
}
