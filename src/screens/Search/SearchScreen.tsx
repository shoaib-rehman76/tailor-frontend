import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { Screen } from "@/src/components/common/Screen";
import { Card } from "@/src/components/common/Card";
import { Input } from "@/src/components/common/Input";
import { SectionHeader } from "@/src/components/common/SectionHeader";
import { remoteApi } from "@/src/api/remoteApi";

function currency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function SearchScreen() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");

  const query = useQuery({
    queryKey: ["orders", "list"],
    queryFn: () => remoteApi.fetchOrders(),
  });

  const results = useMemo(() => {
    const orders = query.data ?? [];
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return orders;
    return orders.filter((order) => {
      const fields = [
        order.customer.name,
        order.customer.phone,
        order.orderNo,
        order.status,
      ]
        .join(" ")
        .toLowerCase();
      return fields.includes(trimmed);
    });
  }, [query.data, q]);

  const customers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; phone: string; orderCount: number; totalPaid: number }
    >();

    for (const order of results) {
      const phone = order.customer.phone;
      const existing = map.get(phone) ?? {
        name: order.customer.name,
        phone,
        orderCount: 0,
        totalPaid: 0,
      };
      existing.orderCount += 1;
      existing.totalPaid += (order.payments ?? []).reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0,
      );
      map.set(phone, existing);
    }

    return Array.from(map.values()).sort(
      (a, b) => b.orderCount - a.orderCount || b.totalPaid - a.totalPaid,
    );
  }, [results]);

  return (
    <Screen contentClassName="p-4 gap-4 bg-[#f5f7fb]" scroll>
      <LinearGradient
        colors={["#111827", "#0f766e", "#22c55e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28, padding: 18 }}
      >
        <Text className="text-xs font-semibold uppercase tracking-[2px] text-white/70">
          {t("search.heroEyebrow")}
        </Text>
        <Text className="mt-2 text-3xl font-black text-white">
          {t("search.title")}
        </Text>
        <Text className="mt-2 text-sm leading-5 text-white/80">
          {t("search.heroDescription")}
        </Text>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-white px-4 py-3">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {t("search.customersFound")}
            </Text>
            <Text className="mt-1 text-2xl font-black text-slate-950">
              {customers.length}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white/15 px-4 py-3">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
              {t("search.ordersScanned")}
            </Text>
            <Text className="mt-1 text-2xl font-black text-white">
              {results.length}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <Card className="gap-3 border-0 bg-white">
        <SectionHeader title={t("search.searchSection")} />
        <Input
          value={q}
          onChangeText={setQ}
          placeholder={t("search.placeholder")}
        />
        <View className="flex-row gap-2">
          <View className="flex-1 rounded-2xl bg-slate-50 px-3 py-3">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {t("search.matchBy")}
            </Text>
            <Text className="mt-1 text-sm font-semibold text-slate-900">
              {t("search.matchByValue")}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-emerald-50 px-3 py-3">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              {t("search.dataSource")}
            </Text>
            <Text className="mt-1 text-sm font-semibold text-slate-900">
              {query.isFetching ? t("common.refreshing") : t("search.liveBackend")}
            </Text>
          </View>
        </View>
      </Card>

      {customers.length === 0 ? (
        <Card className="items-center gap-2 border-0 bg-white py-10">
          <Text className="text-base font-semibold text-slate-900">
            {t("search.noResultsTitle")}
          </Text>
          <Text className="text-sm text-slate-500">
            {t("search.noResultsDescription")}
          </Text>
        </Card>
      ) : (
        customers.map((customer, index) => (
          <Pressable
            key={customer.phone}
            onPress={() =>
              router.push(`/customer/${customer.phone.replace(/\s+/g, "")}`)
            }
          >
            <Card
              className={`gap-3 border-0 ${
                index === 0
                  ? "bg-emerald-50"
                  : index === 1
                    ? "bg-cyan-50"
                    : "bg-white"
              }`}
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-base font-bold text-slate-950">
                    {customer.name}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    {customer.phone}
                  </Text>
                </View>
                <View className="rounded-full bg-slate-900 px-3 py-1">
                  <Text className="text-xs font-bold text-white">
                    {t("search.ordersCount", { count: customer.orderCount })}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1 rounded-2xl bg-white/80 px-3 py-3">
                  <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {t("search.totalSpentValue")}
                  </Text>
                  <Text className="mt-1 text-sm font-bold text-slate-950">
                    Rs {currency(customer.totalPaid)}
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl bg-white/80 px-3 py-3">
                  <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {t("search.profile")}
                  </Text>
                  <Text className="mt-1 text-sm font-bold text-slate-950">
                    {t("search.openHistory")}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
