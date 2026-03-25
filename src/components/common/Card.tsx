import React from "react";
import { View } from "react-native";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`rounded-2xl border border-gray-100 bg-white p-4 ${className ?? ""}`}>
      {children}
    </View>
  );
}

