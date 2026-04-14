import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";

export function Card({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      className={`rounded-2xl border border-gray-100 bg-white p-4 ${className ?? ""}`}
      style={style}
    >
      {children}
    </View>
  );
}
