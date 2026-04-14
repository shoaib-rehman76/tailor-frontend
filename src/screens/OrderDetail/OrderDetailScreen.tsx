import React from "react";
import { Alert, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import NetInfo from "@react-native-community/netinfo";

import { Screen } from "@/src/components/common/Screen";
import { Card } from "@/src/components/common/Card";
import { SectionHeader } from "@/src/components/common/SectionHeader";
import { Button } from "@/src/components/common/Button";
import { remoteApi } from "@/src/api/remoteApi";
import { removeOrderLocal } from "@/src/api/ordersRepository";
import { useAppDispatch } from "@/src/store/hooks";
import { enqueue } from "@/src/store/slices/offlineQueueSlice";
import type { OrderStatus } from "@/src/types/order";
import {
  callPhone,
  openWhatsApp,
  sendSms,
} from "@/src/utils/contactActions";

const STATUS_LABEL_KEY: Record<OrderStatus, string> = {
  PENDING: "ordersBoard.pending",
  CUTTING: "ordersBoard.cutting",
  STITCHING: "ordersBoard.stitching",
  READY: "ordersBoard.ready",
  DELIVERED: "ordersBoard.delivered",
};

export function OrderDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["orders", "list"],
    queryFn: () => remoteApi.fetchOrders(),
  });

  const order = (query.data ?? []).find((o) => o.id === id);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!order) return;
      await removeOrderLocal(order.id);

      const net = await NetInfo.fetch();
      if (!!net.isConnected) {
        try {
          await remoteApi.deleteOrder(order.id);
        } catch {
          dispatch(
            enqueue({
              type: "orders/delete",
              payload: { id: order.id },
            })
          );
        }
      } else {
        dispatch(
          enqueue({
            type: "orders/delete",
            payload: { id: order.id },
          })
        );
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["orders", "list"] });
      await qc.refetchQueries({ queryKey: ["orders", "list"], exact: true });
      router.replace("/(tabs)/orders");
    },
  });

  const confirmDelete = () => {
    if (!order) return;
    Alert.alert(t("orderDetail.deleteTitle"), t("orderDetail.deleteMessage"), [
      { text: t("common.close"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          void deleteMutation.mutateAsync();
        },
      },
    ]);
  };

  const contactMessage = order
    ? t("orderDetail.messageTemplate", {
        name: order.customer.name,
        orderNo: order.orderNo,
        status: t(STATUS_LABEL_KEY[order.status]),
        deliveryDate: new Date(order.deliveryDate).toLocaleDateString(),
      })
    : "";

  const onSendSms = async () => {
    if (!order) return;
    const available = await sendSms(order.customer.phone, contactMessage);
    if (!available) {
      Alert.alert(t("orderDetail.contactCustomer"), t("orderDetail.smsUnavailable"));
    }
  };

  const onSendWhatsApp = async () => {
    if (!order) return;
    try {
      await openWhatsApp(order.customer.phone, contactMessage);
    } catch {
      Alert.alert(t("orderDetail.contactCustomer"), t("orderDetail.contactError"));
    }
  };

  const onCallCustomer = async () => {
    if (!order) return;
    try {
      await callPhone(order.customer.phone);
    } catch {
      Alert.alert(t("orderDetail.contactCustomer"), t("orderDetail.contactError"));
    }
  };

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
            <Text className="text-sm text-gray-600">
              {t("orderDetail.statusLabel", {
                status: t(STATUS_LABEL_KEY[order.status]),
              })}
            </Text>
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

          <Card className="gap-3">
            <SectionHeader title={t("orderDetail.contactCustomer")} />
            <Button
              title={t("orderDetail.sendSms")}
              variant="secondary"
              onPress={() => {
                void onSendSms();
              }}
            />
            <Button
              title={t("orderDetail.sendWhatsApp")}
              variant="secondary"
              onPress={() => {
                void onSendWhatsApp();
              }}
            />
            <Button
              title={t("orderDetail.callCustomer")}
              variant="secondary"
              onPress={() => {
                void onCallCustomer();
              }}
            />
          </Card>

          <Card className="gap-3">
            <Button
              title={t("orderDetail.editOrder")}
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/new-order",
                  params: { editOrderId: order.id },
                })
              }
            />
            <Button
              title={t("orderDetail.deleteOrder")}
              variant="danger"
              loading={deleteMutation.isPending}
              onPress={confirmDelete}
            />
          </Card>
        </>
      )}
    </Screen>
  );
}
