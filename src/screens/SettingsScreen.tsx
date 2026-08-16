import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../context/CurrencyContext';
import { CURRENCIES, Currency } from '../constants/currencies';

export default function SettingsScreen() {
  const { currency, setCurrency } = useCurrency();

  const handleSelect = (c: Currency) => {
    setCurrency(c);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-extrabold text-gray-900">Settings ⚙️</Text>
        <Text className="text-sm text-gray-500 mt-0.5">Customize your app</Text>
      </View>

      {/* Currency section */}
      <View className="mx-5 mt-4 bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <View className="px-4 py-3 border-b border-gray-100">
          <Text className="text-base font-bold text-gray-900">💱 Currency</Text>
          <Text className="text-xs text-gray-400 mt-0.5">
            Choose how amounts are displayed
          </Text>
        </View>

        <FlatList
          data={CURRENCIES}
          keyExtractor={(item) => item.code}
          scrollEnabled={false}
          renderItem={({ item, index }) => {
            const selected = item.code === currency.code;
            const isLast = index === CURRENCIES.length - 1;
            return (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                className={`flex-row items-center px-4 py-3.5 ${!isLast ? 'border-b border-gray-50' : ''}`}
                style={selected ? { backgroundColor: '#FFEDC9' } : {}}
              >
                {/* Flag */}
                <Text className="text-2xl mr-3">{item.flag}</Text>

                {/* Name + code */}
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: selected ? '#F08A00' : '#111827' }}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-xs text-gray-400">{item.code}</Text>
                </View>

                {/* Symbol */}
                <Text
                  className="text-base font-bold mr-3"
                  style={{ color: selected ? '#F08A00' : '#6B7280' }}
                >
                  {item.symbol}
                </Text>

                {/* Checkmark */}
                {selected && (
                  <Text className="text-primary text-base">✓</Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* App info */}
      <View className="mx-5 mt-4 bg-white rounded-2xl border border-gray-100 px-4 py-4">
        <Text className="text-base font-bold text-gray-900 mb-3">ℹ️ App Info</Text>
        <Row label="Version" value="1.0.0" />
        <Row label="Storage" value="Local (AsyncStorage)" />
        <Row label="Platform" value="Expo SDK 54" />
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-1.5">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-800">{value}</Text>
    </View>
  );
}
