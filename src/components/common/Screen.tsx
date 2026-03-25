import React from "react";
import { RefreshControlProps, SafeAreaView, ScrollView, View } from "react-native";

export function Screen({
  children,
  scroll = true,
  contentClassName,
  refreshControl,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentClassName?: string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}) {
  if (!scroll) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className={contentClassName ?? "flex-1"}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName={contentClassName ?? "p-4 gap-4"}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

