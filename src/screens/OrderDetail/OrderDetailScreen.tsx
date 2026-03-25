import React from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Screen } from "@/src/components/common/Screen";
import { Card } from "@/src/components/common/Card";
import { SectionHeader } from "@/src/components/common/SectionHeader";
import { getOrderById } from "@/src/api/ordersRepository";

export function OrderDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () => getOrderById(String(id)),
  });

  const order = query.data;

  return (
    <Screen contentClassName="p-4 gap-4" scroll>
      <SectionHeader title={`#${order?.orderNo ?? ""}`} />

      {!order ? (
        <Text className="text-sm text-gray-500">{t("common.loading")}</Text>
      ) : (
        <>
          <Card className="gap-2">
            <Text className="text-base font-semibold text-black">
              {order.customer.name}
            </Text>
            <Text className="text-sm text-gray-600">{order.customer.phone}</Text>
            <Text className="text-sm text-gray-600">
              {t("ordersBoard.delivery")}:{" "}
              {new Date(order.deliveryDate).toLocaleDateString()}
            </Text>
            <Text className="text-sm text-gray-600">Status: {order.status}</Text>
          </Card>

          <Card className="gap-2">
            <SectionHeader title={t("newOrder.orderDetails")} />
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">{t("newOrder.price")}</Text>
              <Text className="text-base font-semibold text-black">
                {order.price}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">{t("newOrder.advance")}</Text>
              <Text className="text-base font-semibold text-black">
                {order.advance}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">{t("newOrder.remaining")}</Text>
              <Text className="text-base font-semibold text-black">
                {Math.max(0, (order.price || 0) - (order.advance || 0))}
              </Text>
            </View>
          </Card>

          {order.notes ? (
            <Card className="gap-2">
              <SectionHeader title={t("newOrder.notes")} />
              <Text className="text-sm text-gray-700">{order.notes}</Text>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

