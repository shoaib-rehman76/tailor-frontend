import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
}) {
  const base =
    "h-12 rounded-xl items-center justify-center px-4 flex-row gap-2";
  const colors =
    variant === "primary"
      ? "bg-black"
      : variant === "danger"
        ? "bg-red-600"
        : "bg-gray-100";
  const text =
    variant === "primary" || variant === "danger"
      ? "text-white"
      : "text-black";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${base} ${colors} ${disabled ? "opacity-40" : "opacity-100"}`}
    >
      {loading ? <ActivityIndicator color={variant === "secondary" ? "#000" : "#fff"} /> : null}
      <Text className={`text-base font-semibold ${text}`}>{title}</Text>
    </Pressable>
  );
}

