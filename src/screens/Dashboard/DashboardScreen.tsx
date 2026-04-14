import { remoteApi } from "@/src/api/remoteApi";
import { Card } from "@/src/components/common/Card";
import { Screen } from "@/src/components/common/Screen";
import { SectionHeader } from "@/src/components/common/SectionHeader";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";

function currency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(value);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isSameDay(left: number | Date, right: number | Date) {
  const a = new Date(left);
  const b = new Date(right);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DashboardScreen() {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  const query = useQuery({
    queryKey: ["orders", "list"],
    queryFn: () => remoteApi.fetchOrders(),
  });

  const stats = useMemo(() => {
    const orders = query.data ?? [];
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const pending = orders.filter((o) => o.status === "PENDING").length;
    const cutting = orders.filter((o) => o.status === "CUTTING").length;
    const stitching = orders.filter((o) => o.status === "STITCHING").length;
    const ready = orders.filter((o) => o.status === "READY").length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const activeOrders = orders.filter((o) => o.status !== "DELIVERED").length;
    const dueToday = orders.filter((o) =>
      isSameDay(o.deliveryDate, today),
    ).length;
    const overdue = orders.filter(
      (o) => o.status !== "DELIVERED" && new Date(o.deliveryDate) < today,
    ).length;
    const readyForPickup = orders.filter((o) => o.status === "READY").length;
    const totalOrders = orders.length;
    const totalCustomers = new Set(orders.map((o) => o.customer.phone)).size;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0);
    const collectedRevenue = orders.reduce(
      (sum, o) =>
        sum +
        (o.payments ?? []).reduce((inner, payment) => inner + (payment.amount || 0), 0),
      0,
    );
    const outstandingRevenue = Math.max(0, totalRevenue - collectedRevenue);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      orders,
      pending,
      cutting,
      stitching,
      ready,
      delivered,
      activeOrders,
      dueToday,
      overdue,
      readyForPickup,
      totalOrders,
      totalCustomers,
      totalRevenue,
      collectedRevenue,
      outstandingRevenue,
      avgOrderValue,
    };
  }, [query.data]);

  const topCustomers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; phone: string; count: number; totalPaid: number }
    >();

    for (const order of stats.orders) {
      const phone = order.customer.phone;
      const existing = map.get(phone) ?? {
        name: order.customer.name,
        phone,
        count: 0,
        totalPaid: 0,
      };

      existing.count += 1;
      existing.totalPaid += (order.payments ?? []).reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0,
      );
      map.set(phone, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count || b.totalPaid - a.totalPaid)
      .slice(0, 4);
  }, [stats.orders]);

  const statusPie = useMemo(
    () => [
      { value: stats.pending, color: "#1d4ed8", label: t("ordersBoard.pending") },
      { value: stats.cutting, color: "#f97316", label: t("ordersBoard.cutting") },
      { value: stats.stitching, color: "#0891b2", label: t("ordersBoard.stitching") },
      { value: stats.ready, color: "#10b981", label: t("ordersBoard.ready") },
      { value: stats.delivered, color: "#64748b", label: t("ordersBoard.delivered") },
    ],
    [stats, t],
  );

  const weeklyBars = useMemo(() => {
    const today = startOfDay(new Date());
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    const labels = ["M", "T", "W", "T", "F", "S", "S"];
    const counts = new Array(7).fill(0);

    for (const order of stats.orders) {
      const created = startOfDay(new Date(order.createdAt));
      const idx = Math.floor(
        (created.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (idx >= 0 && idx < 7) {
        counts[idx] += 1;
      }
    }

    return counts.map((value, index) => ({
      value,
      label: labels[index],
      frontColor: index >= 5 ? "#fb7185" : "#0f172a",
      gradientColor: index >= 5 ? "#fda4af" : "#60a5fa",
      spacing: 18,
      labelTextStyle: { color: "#64748b", fontSize: 11 },
    }));
  }, [stats.orders]);

  const workflowCards = useMemo(
    () => [
      {
        label: t("dashboard.totalOrders"),
        value: stats.totalOrders,
        note: t("dashboard.totalOrdersNote"),
        colors: ["#dbeafe", "#eff6ff"] as const,
        accent: "#1d4ed8",
      },
      {
        label: t("dashboard.activeOrders"),
        value: stats.activeOrders,
        note: t("dashboard.activeOrdersNote"),
        colors: ["#cffafe", "#ecfeff"] as const,
        accent: "#0891b2",
      },
      {
        label: t("dashboard.dueToday"),
        value: stats.dueToday,
        note: t("dashboard.dueTodayNote"),
        colors: ["#d1fae5", "#ecfdf5"] as const,
        accent: "#059669",
      },
      {
        label: t("dashboard.readyForPickup"),
        value: stats.readyForPickup,
        note: t("dashboard.readyForPickupNote"),
        colors: ["#ffe4e6", "#fff1f2"] as const,
        accent: "#e11d48",
      },
    ],
    [stats, t],
  );

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
      contentClassName="px-4 pt-4 gap-4 bg-[#f5f7fb]"
      bottomOffset={120}
      scroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={["#0f172a", "#1d4ed8", "#22c55e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28, padding: 20 }}
      >
        <View className="gap-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-white/80 text-xs uppercase tracking-[2px]">
                {t("dashboard.heroEyebrow")}
              </Text>
              <Text className="mt-2 text-3xl font-extrabold text-white">
                {t("dashboard.title")}
              </Text>
              <Text className="mt-2 text-sm text-white/80 leading-5">
                {t("dashboard.heroDescription")}
              </Text>
              <Text className="mt-3 text-xs text-white/70">
                {query.isFetching
                  ? t("common.refreshing")
                  : t("dashboard.lastUpdated", {
                      time: new Date(
                        query.dataUpdatedAt || Date.now(),
                      ).toLocaleTimeString(),
                    })}
              </Text>
            </View>

            <View className="rounded-2xl bg-white/15 px-4 py-3">
              <Text className="text-xs font-semibold uppercase tracking-wide text-white/70">
                {t("dashboard.customers")}
              </Text>
              <Text className="mt-1 text-3xl font-black text-white">
                {stats.totalCustomers}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push("/(tabs)/new-order")}
              className="flex-1 rounded-2xl bg-white px-4 py-4"
            >
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("dashboard.quickAction")}
              </Text>
              <Text className="mt-1 text-lg font-bold text-slate-900">
                + {t("tabs.newOrder")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(tabs)/orders")}
              className="flex-1 rounded-2xl bg-white/15 px-4 py-4"
            >
              <Text className="text-xs font-semibold uppercase tracking-wide text-white/70">
                {t("dashboard.inProgress")}
              </Text>
              <Text className="mt-1 text-lg font-bold text-white">
                {stats.pending + stats.cutting + stats.stitching}
              </Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <View className="flex-row flex-wrap gap-3">
        {workflowCards.map((item) => (
          <LinearGradient
            key={item.label}
            colors={item.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flexBasis: "48%",
              flexGrow: 1,
              borderRadius: 24,
              padding: 16,
            }}
          >
            <Text
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: item.accent }}
            >
              {item.label}
            </Text>
            <Text className="mt-2 text-3xl font-extrabold text-slate-950">
              {item.value}
            </Text>
            <Text className="mt-1 text-xs leading-5 text-slate-600">
              {item.note}
            </Text>
          </LinearGradient>
        ))}
      </View>

      <Card className="overflow-hidden border-0 p-0">
        <LinearGradient
          colors={["#fff7ed", "#ffffff", "#eff6ff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 18, borderRadius: 24 }}
        >
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                {t("dashboard.revenueSnapshot")}
              </Text>
              <Text className="mt-1 text-2xl font-black text-slate-950">
                Rs {currency(stats.totalRevenue)}
              </Text>
              <Text className="mt-1 text-sm text-slate-500">
                {t("dashboard.totalValue")}
              </Text>
            </View>
            <View className="rounded-2xl bg-slate-900 px-4 py-3">
              <Text className="text-xs uppercase tracking-wide text-white/60">
                {t("ordersBoard.delivered")}
              </Text>
              <Text className="mt-1 text-xl font-bold text-white">
                {stats.delivered}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-emerald-50 p-4">
              <Text className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {t("dashboard.collected")}
              </Text>
              <Text className="mt-1 text-xl font-bold text-slate-900">
                Rs {currency(stats.collectedRevenue)}
              </Text>
            </View>
            <View className="flex-1 rounded-2xl bg-rose-50 p-4">
              <Text className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                {t("dashboard.outstanding")}
              </Text>
              <Text className="mt-1 text-xl font-bold text-slate-900">
                Rs {currency(stats.outstandingRevenue)}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Card>

      <View className="flex-row gap-3">
        <Card className="flex-1 gap-3 border-0 bg-white">
          <SectionHeader title={t("dashboard.deliveryFocus")} />
          <View className="gap-3">
            <View className="rounded-2xl bg-slate-50 p-4">
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("dashboard.dueToday")}
              </Text>
              <Text className="mt-1 text-2xl font-black text-slate-950">
                {stats.dueToday}
              </Text>
            </View>
            <View className="rounded-2xl bg-rose-50 p-4">
              <Text className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                {t("dashboard.overdue")}
              </Text>
              <Text className="mt-1 text-2xl font-black text-slate-950">
                {stats.overdue}
              </Text>
            </View>
          </View>
        </Card>

        <Card className="flex-1 gap-3 border-0 bg-white">
          <SectionHeader title={t("dashboard.productionFocus")} />
          <View className="gap-3">
            <View className="rounded-2xl bg-amber-50 p-4">
              <Text className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                {t("ordersBoard.cutting")}
              </Text>
              <Text className="mt-1 text-2xl font-black text-slate-950">
                {stats.cutting}
              </Text>
            </View>
            <View className="rounded-2xl bg-cyan-50 p-4">
              <Text className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                {t("ordersBoard.stitching")}
              </Text>
              <Text className="mt-1 text-2xl font-black text-slate-950">
                {stats.stitching}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      <Card className="gap-4 border-0 bg-white">
        <SectionHeader title={t("dashboard.productionMix")} />
        <View className="items-center">
          <PieChart
            data={statusPie}
            donut
            showText={false}
            radius={86}
            innerRadius={54}
            strokeColor="#ffffff"
            strokeWidth={3}
            centerLabelComponent={() => (
              <View className="items-center">
                <Text className="text-xs uppercase tracking-wide text-slate-400">
                  {t("common.total")}
                </Text>
                <Text className="text-2xl font-black text-slate-950">
                  {stats.totalOrders}
                </Text>
              </View>
            )}
          />
        </View>

        <View className="flex-row flex-wrap justify-center gap-3">
          {statusPie.map((item) => (
            <View
              key={item.label}
              className="min-w-[44%] rounded-2xl bg-slate-50 px-3 py-3"
            >
              <View className="flex-row items-center gap-2">
                <View
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {item.label}
                </Text>
              </View>
              <Text className="mt-2 text-xl font-bold text-slate-950">
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card className="gap-4 border-0 bg-white">
        <SectionHeader title={t("dashboard.weeklyOrders")} />
        <BarChart
          data={weeklyBars}
          barWidth={24}
          initialSpacing={8}
          spacing={16}
          roundedTop
          roundedBottom
          hideRules
          yAxisThickness={0}
          xAxisThickness={0}
          showGradient
          noOfSections={4}
          maxValue={Math.max(4, ...weeklyBars.map((item) => item.value + 1))}
        />
      </Card>

      {topCustomers.length > 0 && (
        <Card className="gap-3 border-0 bg-white mb-[5rem]">
          <SectionHeader title={t("dashboard.topCustomers")} />
          {topCustomers.map((customer, index) => (
            <Pressable
              key={customer.phone}
              onPress={() =>
                router.push(`/customer/${customer.phone.replace(/\s+/g, "")}`)
              }
              className={`rounded-2xl px-4 py-4 ${
                index === 0
                  ? "bg-amber-50"
                  : index === 1
                    ? "bg-slate-100"
                    : index === 2
                      ? "bg-emerald-50"
                      : "bg-slate-50"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-bold text-slate-950">
                    {customer.name}
                  </Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    {customer.phone}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("customerHistory.orderCount")}
                  </Text>
                  <Text className="text-lg font-black text-slate-950">
                    {customer.count}
                  </Text>
                </View>
              </View>
              <View className="mt-3 h-px bg-black/5" />
              <Text className="mt-3 text-sm text-slate-600">
                {t("dashboard.paidSoFar", { amount: currency(customer.totalPaid) })}
              </Text>
            </Pressable>
          ))}
        </Card>
      )}
    </Screen>
  );
}
