import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProtectedLayout } from "@/src/components/auth/ProtectedLayout";

function TabIcon({
  focused,
  color,
  size,
  icon,
  label,
  prominent = false,
}: {
  focused: boolean;
  color: string;
  size: number;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  prominent?: boolean;
}) {
  if (prominent) {
    return (
      <View className="items-center justify-center -mt-6">
        <LinearGradient
          colors={focused ? ["#0f172a", "#2563eb"] : ["#1e293b", "#334155"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#0f172a",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.22,
            shadowRadius: 18,
            elevation: 12,
          }}
        >
          <Ionicons name={icon} color="#ffffff" size={26} />
        </LinearGradient>
        <Text className="mt-2 text-[10px] font-semibold text-slate-500">
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View className="items-center justify-center gap-1">
      <View
        style={{
          width: 44,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: focused ? "rgba(37, 99, 235, 0.12)" : "transparent",
        }}
      >
        <Ionicons name={icon} color={focused ? "#1d4ed8" : color} size={size} />
      </View>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        className={`text-[10px] font-semibold ${
          focused ? "text-slate-900" : "text-slate-400"
        }`}
        style={{ maxWidth: 58 }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const [showTabBar, setShowTabBar] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setShowTabBar(false);
    });
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setShowTabBar(true);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const bottomInset = insets.bottom + 8;

  return (
    <ProtectedLayout>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#1d4ed8",
          tabBarInactiveTintColor: "#94a3b8",
          tabBarStyle: {
            position: "absolute",
            left: 16,
            right: 16,
            bottom: bottomInset,
            height: 72,
            borderRadius: 28,
            paddingTop: 10,
            paddingBottom: 8,
            backgroundColor: "transparent",
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.55)",
            shadowColor: "#0f172a",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.16,
            shadowRadius: 24,
            elevation: 16,
            display: showTabBar ? "flex" : "none",
          },
          tabBarItemStyle: {
            borderRadius: 22,
          },
          tabBarBackground: () => (
            <View style={{ flex: 1, borderRadius: 28, overflow: "hidden" }}>
              <BlurView tint="light" intensity={36} style={{ flex: 1 }} />
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(255,255,255,0.96)", "rgba(241,245,249,0.98)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("tabs.dashboard"),
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                focused={focused}
                color={color}
                size={22}
                icon="home-outline"
                label={t("tabs.dashboard")}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: t("tabs.orders"),
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                focused={focused}
                color={color}
                size={22}
                icon="albums-outline"
                label={t("tabs.orders")}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="new-order"
          options={{
            title: t("tabs.newOrder"),
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                focused={focused}
                color={color}
                size={24}
                icon="add"
                label={t("tabs.newOrder")}
                prominent
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: t("tabs.search"),
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                focused={focused}
                color={color}
                size={22}
                icon="search-outline"
                label={t("tabs.search")}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("tabs.profile"),
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                focused={focused}
                color={color}
                size={22}
                icon="person-outline"
                label={t("tabs.profile")}
              />
            ),
          }}
        />
      </Tabs>
    </ProtectedLayout>
  );
}
