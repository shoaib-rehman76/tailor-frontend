import React, { useMemo } from "react";
import { Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { FractionButtons } from "@/src/components/measurement/FractionButtons";

function toNumberOrUndefined(text: string) {
  const normalized = text.replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export function MeasurementInput({
  labelKey,
  value,
  onChange,
  min = 0,
  max = 200,
}: {
  labelKey: string;
  value: number | undefined;
  onChange: (next: number | undefined) => void;
  min?: number;
  max?: number;
}) {
  const { t } = useTranslation();
  const textValue = value === undefined ? "" : String(value);

  const error = useMemo(() => {
    if (value === undefined) return undefined;
    if (value < min || value > max) return t("measurement.minMax");
    return undefined;
  }, [value, min, max, t]);

  return (
    <View className="gap-2">
      <Text className="text-sm text-gray-700">{t(labelKey)}</Text>
      <View className="flex-row items-center gap-2">
        <TextInput
          value={textValue}
          onChangeText={(txt) => onChange(toNumberOrUndefined(txt))}
          keyboardType="decimal-pad"
          className={`flex-1 rounded-xl border px-4 py-3 text-base ${
            error ? "border-red-400" : "border-gray-200"
          }`}
          placeholder="0"
        />
        <FractionButtons
          onAdd={(delta) => onChange(((value ?? 0) + delta) as number)}
        />
      </View>
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}

