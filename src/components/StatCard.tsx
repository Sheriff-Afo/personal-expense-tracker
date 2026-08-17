import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  label: string;
  value: string;
  icon: string;
  colorClass?: string;    // Tailwind text colour class, e.g. "text-primary"
  hexColor?: string;      // Fallback inline colour
  sub?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  colorClass = 'text-primary',
  hexColor,
  sub,
}: Props) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-2xl">{icon}</Text>
        <Text
          className={`text-xl font-extrabold ${colorClass}`}
          style={hexColor ? { color: hexColor } : undefined}
        >
          {value}
        </Text>
      </View>
      <Text className="text-sm text-gray-500 font-medium">{label}</Text>
      {sub ? <Text className="text-xs text-gray-400 mt-0.5">{sub}</Text> : null}
    </View>
  );
}
