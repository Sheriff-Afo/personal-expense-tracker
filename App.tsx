import './global.css';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { seedDemoData } from './src/storage/expenseStorage';
import { CurrencyProvider } from './src/context/CurrencyContext';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDemoData().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-4xl mb-4">💰</Text>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text className="text-gray-500 mt-3 text-sm">Loading Expense Tracker…</Text>
      </View>
    );
  }

  return (
    <CurrencyProvider>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </SafeAreaProvider>
    </CurrencyProvider>
  );
}
