import React from "react";
import {
  RefreshControlProps,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export function Screen({
  children,
  scroll = true,
  contentClassName,
  refreshControl,
  bottomOffset = 100, // Default offset for tab bar
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentClassName?: string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  bottomOffset?: number;
}) {
  const insets = useSafeAreaInsets();

  if (!scroll) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
        <View className={contentClassName ?? "flex-1"}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName={contentClassName ?? "p-4 gap-4"}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingBottom: bottomOffset + insets.bottom }}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
