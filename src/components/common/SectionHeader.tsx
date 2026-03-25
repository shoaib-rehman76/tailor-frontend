import React from "react";
import { Text, View } from "react-native";

export function SectionHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-lg font-semibold text-black">{title}</Text>
      {right}
    </View>
  );
}

