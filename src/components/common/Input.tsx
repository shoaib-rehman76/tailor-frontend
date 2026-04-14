import React from "react";
import { Text, TextInput, View } from "react-native";

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
  multiline,
  secureTextEntry,
  autoCapitalize = "sentences",
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?:
    | "default"
    | "number-pad"
    | "phone-pad"
    | "decimal-pad"
    | "email-address";
  error?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View className="gap-1">
      {label ? <Text className="text-sm text-gray-700">{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        className={`rounded-xl border px-4 py-3 text-base ${
          multiline ? "min-h-[96px]" : ""
        } ${error ? "border-red-400" : "border-gray-200"}`}
      />
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}
