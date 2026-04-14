import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { Screen } from "@/src/components/common/Screen";
import { Card } from "@/src/components/common/Card";
import { SectionHeader } from "@/src/components/common/SectionHeader";
import { remoteApi } from "@/src/api/remoteApi";
import type { OrderStatus } from "@/src/types/order";

const STATUS_LABEL_KEY: Record<OrderStatus, string> = {
  PENDING: "ordersBoard.pending",
  CUTTING: "ordersBoard.cutting",
  STITCHING: "ordersBoard.stitching",
  READY: "ordersBoard.ready",
  DELIVERED: "ordersBoard.delivered",
};

export function CustomerHistoryScreen() {
  const { t } = useTranslation();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const allOrdersQuery = useQuery({
    queryKey: ["orders", "list"],
    queryFn: () => remoteApi.fetchOrders(),
  });

  const query = useMemo(() => {
    const orders = (allOrdersQuery.data ?? [])
      .filter((o) => o.customer.phone === String(phone ?? ""))
      .sort((a, b) => b.createdAt - a.createdAt);
    return { ...allOrdersQuery, data: orders };
  }, [allOrdersQuery, phone]);

  const summary = useMemo(() => {
    const orders = query.data ?? [];
    const totalSpent = orders.reduce((acc, o) => acc + (o.price || 0), 0);
    return { totalSpent, count: orders.length };
  }, [query.data]);

  return (
    <Screen contentClassName="p-4 gap-4" scroll>
      <SectionHeader title={t("customerHistory.title")} />

      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Text className="text-sm text-gray-500">
            {t("customerHistory.totalSpent")}
          </Text>
          <Text className="text-2xl font-bold text-black">{summary.totalSpent}</Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-sm text-gray-500">
            {t("customerHistory.orderCount")}
          </Text>
          <Text className="text-2xl font-bold text-black">{summary.count}</Text>
        </Card>
      </View>

      {(query.data ?? []).map((o) => (
        <Pressable key={o.id} onPress={() => router.push(`/order/${o.id}`)}>
          <Card className="gap-1">
            <Text className="text-base font-semibold text-black">
              #{o.orderNo} • {o.customer.name}
            </Text>
            <Text className="text-sm text-gray-600">
              {new Date(o.createdAt).toLocaleDateString()} •{" "}
              {t(STATUS_LABEL_KEY[o.status])} • {o.price}
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/new-order",
                  params: { phone: o.customer.phone, copyOrderId: o.id },
                })
              }
              className="mt-2 h-10 rounded-xl bg-gray-100 items-center justify-center"
            >
              <Text className="font-semibold text-black">
                {t("customerHistory.reorder")}
              </Text>
            </Pressable>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
