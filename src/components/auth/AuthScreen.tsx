import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";
import { Screen } from "@/src/components/common/Screen";

export function AuthScreen({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Screen contentClassName="flex-1 bg-[#eef4ff]" scroll>
      <LinearGradient
        colors={["#0f172a", "#1d4ed8", "#38bdf8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ margin: 16, borderRadius: 28, padding: 22 }}
      >
        <Text className="text-xs font-semibold uppercase tracking-[2px] text-white/70">
          {eyebrow}
        </Text>
        <Text className="mt-3 text-3xl font-black text-white">{title}</Text>
        <Text className="mt-2 text-sm leading-6 text-white/80">{subtitle}</Text>
      </LinearGradient>

      <View className="px-4 pb-8">{children}</View>
    </Screen>
  );
}
