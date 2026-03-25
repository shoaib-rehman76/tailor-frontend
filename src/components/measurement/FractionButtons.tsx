import React from "react";
import { Pressable, Text, View } from "react-native";

const FRACTIONS = [
  { label: "+0.25", value: 0.25 },
  { label: "+0.5", value: 0.5 },
  { label: "+0.75", value: 0.75 },
] as const;

export function FractionButtons({
  onAdd,
}: {
  onAdd: (delta: number) => void;
}) {
  return (
    <View className="flex-row gap-2">
      {FRACTIONS.map((f) => (
        <Pressable
          key={f.label}
          onPress={() => onAdd(f.value)}
          className="h-9 px-3 rounded-xl bg-gray-100 items-center justify-center"
        >
          <Text className="font-semibold text-black">{f.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

