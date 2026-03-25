import { listOrders, seedMockOrdersIfEmpty } from "@/src/api/ordersRepository";
import { Card } from "@/src/components/common/Card";
import { Screen } from "@/src/components/common/Screen";
import { SectionHeader } from "@/src/components/common/SectionHeader";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";

export function DashboardScreen() {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  const query = useQuery({
    queryKey: ["orders", "list"],
    queryFn: async () => {
      await seedMockOrdersIfEmpty();
      return listOrders();
    },
  });

  const stats = useMemo(() => {
    const orders = query.data ?? [];
    const pending = orders.filter((o) => o.status === "PENDING").length;
    const cutting = orders.filter((o) => o.status === "CUTTING").length;
    const stitching = orders.filter((o) => o.status === "STITCHING").length;
    const ready = orders.filter((o) => o.status === "READY").length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const dueTomorrow = orders.filter((o) => {
      const d = new Date(o.deliveryDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return (
        d.getFullYear() === tomorrow.getFullYear() &&
        d.getMonth() === tomorrow.getMonth() &&
        d.getDate() === tomorrow.getDate()
      );
    }).length;
    return { pending, cutting, stitching, ready, delivered, dueTomorrow, orders };
  }, [query.data]);

  const topCustomers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; phone: string; count: number; totalPaid: number }
    >();
    for (const o of stats.orders ?? []) {
      const phone = o.customer.phone;
      const existing = map.get(phone) ?? {
        name: o.customer.name,
        phone,
        count: 0,
        totalPaid: 0,
      };
      existing.count += 1;
      const paid = (o.payments ?? []).reduce((sum, p) => sum + (p.amount || 0), 0);
      existing.totalPaid += paid;
      map.set(phone, existing);
    }
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [stats.orders]);

  const statusPie = useMemo(() => {
    const base = [
      { color: "#111827", label: t("ordersBoard.pending") },
      { color: "#f59e0b", label: t("ordersBoard.cutting") },
      { color: "#3b82f6", label: t("ordersBoard.stitching") },
      { color: "#10b981", label: t("ordersBoard.ready") },
      { color: "#6b7280", label: t("ordersBoard.delivered") },
    ];

    // Always show a nice-looking dummy distribution for now.
    const dummyValues = [5, 3, 2, 4, 1];

    return base.map((entry, idx) => ({
      value: dummyValues[idx] ?? 1,
      color: entry.color,
      label: entry.label,
    }));
  }, [t]);

  const weeklyBars = useMemo(() => {
    const orders = query.data ?? [];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    // Last 7 days including today
    start.setDate(start.getDate() - 6);

    const counts = new Array(7).fill(0);
    for (const o of orders) {
      const d = new Date(o.createdAt);
      d.setHours(0, 0, 0, 0);
      const idx = Math.floor(
        (d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (idx >= 0 && idx < 7) counts[idx] += 1;
    }

    const labels = new Array(7).fill(0).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return days[(d.getDay() + 6) % 7]; // shift so Mon..Sun
    });

    return counts.map((v, i) => ({
      value: v,
      label: labels[i],
      frontColor: v === 0 ? "#e5e7eb" : "#111827",
    }));
  }, [query.data]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [query]);

  return (
    <Screen
      contentClassName="p-4 gap-4"
      scroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="gap-2">
        <Text className="text-2xl font-bold text-black">
          {t("dashboard.title")}
        </Text>
        <Text className="text-sm text-gray-500">
          {query.isFetching ? t("common.loading") : ""}
        </Text>
      </View>

      <Card className="gap-3">
        <SectionHeader title="Quick actions" />
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => router.push("/(tabs)/new-order")}
            className="flex-1 h-12 rounded-xl bg-black items-center justify-center"
          >
            <Text className="text-white font-semibold">
              + {t("tabs.newOrder")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/orders")}
            className="flex-1 h-12 rounded-xl bg-gray-100 items-center justify-center"
          >
            <Text className="text-black font-semibold">{t("tabs.orders")}</Text>
          </Pressable>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => router.push("/(tabs)/search")}
            className="flex-1 h-12 rounded-xl bg-gray-100 items-center justify-center"
          >
            <Text className="text-black font-semibold">{t("tabs.search")}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            className="flex-1 h-12 rounded-xl bg-gray-100 items-center justify-center"
          >
            <Text className="text-black font-semibold">
              {t("tabs.profile")}
            </Text>
          </Pressable>
        </View>
      </Card>

      <View className="flex-row gap-3">
        <Card className="flex-1 bg-indigo-50">
          <Text className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
            {t("dashboard.pending")}
          </Text>
          <Text className="mt-1 text-3xl font-extrabold text-black">
            {stats.pending}
          </Text>
        </Card>
        <Card className="flex-1 bg-sky-50">
          <Text className="text-xs font-semibold text-sky-600 uppercase tracking-wide">
            {t("dashboard.stitching")}
          </Text>
          <Text className="mt-1 text-3xl font-extrabold text-black">
            {stats.stitching}
          </Text>
        </Card>
      </View>

      <View className="flex-row gap-3">
        <Card className="flex-1 bg-emerald-50">
          <Text className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
            {t("dashboard.ready")}
          </Text>
          <Text className="mt-1 text-3xl font-extrabold text-black">
            {stats.ready}
          </Text>
        </Card>
        <Card className="flex-1 bg-amber-50">
          <Text className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
            {t("dashboard.dueTomorrow")}
          </Text>
          <Text className="mt-1 text-3xl font-extrabold text-black">
            {stats.dueTomorrow}
          </Text>
        </Card>
      </View>

      <Card className="gap-3">
        <SectionHeader title="Order status" />
        <View className="items-center">
          <PieChart
            data={statusPie}
            donut
            showText={false}
            radius={78}
            innerRadius={46}
            strokeWidth={2}
            strokeColor="#ffffff"
          />
        </View>
        <View className="flex-row flex-wrap gap-3 justify-center">
          {statusPie
            .filter((x) => x.label)
            .map((x) => (
              <View key={x.label} className="flex-row items-center gap-2">
                <View
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: x.color }}
                />
                <Text className="text-xs text-gray-700">
                  {x.label} ({x.value})
                </Text>
              </View>
            ))}
        </View>
      </Card>

      <Card className="gap-3">
        <SectionHeader title={t("dashboard.weeklyOrders")} />
        <BarChart
          data={weeklyBars}
          barWidth={22}
          spacing={14}
          roundedTop
          hideRules
          yAxisThickness={0}
          xAxisThickness={0}
          xAxisLabelTextStyle={{ fontSize: 11, color: "#6b7280" }}
          noOfSections={3}
        />
      </Card>

      {topCustomers.length > 0 && (
        <Card className="gap-3 mb-[5rem]">
          <SectionHeader title={t("dashboard.topCustomers")} />
          {topCustomers.map((c, index) => (
            <Pressable
              key={c.phone}
              onPress={() => router.push(`/customer/${c.phone.replace(/\s+/g, "")}`)}
            >
              <View
                className={`flex-row items-center justify-between py-2 px-2 rounded-xl ${
                  index === 0
                    ? "bg-yellow-50"
                    : index === 1
                    ? "bg-gray-100"
                    : ""
                }`}
              >
                <View>
                  <Text className="text-sm font-semibold text-black">
                    {c.name}
                  </Text>
                  <Text className="text-xs text-gray-500">{c.phone}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-gray-700">
                    {t("customerHistory.orderCount")}: {c.count}
                  </Text>
                  <Text className="text-xs text-gray-700">
                    {t("customerHistory.totalSpent")}: {c.totalPaid}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </Card>
      )}
    </Screen>
  );
}
