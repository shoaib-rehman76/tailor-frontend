import React, { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { Screen } from "@/src/components/common/Screen";
import { Card } from "@/src/components/common/Card";
import type { Order, OrderStatus } from "@/src/types/order";
import { updateOrderStatusLocal } from "@/src/api/ordersRepository";
import { remoteApi } from "@/src/api/remoteApi";
import { useAppDispatch } from "@/src/store/hooks";
import { enqueue } from "@/src/store/slices/offlineQueueSlice";

const COLUMNS: { status: OrderStatus; tKey: string }[] = [
  { status: "PENDING", tKey: "ordersBoard.pending" },
  { status: "CUTTING", tKey: "ordersBoard.cutting" },
  { status: "STITCHING", tKey: "ordersBoard.stitching" },
  { status: "READY", tKey: "ordersBoard.ready" },
  { status: "DELIVERED", tKey: "ordersBoard.delivered" },
];

const STATUS_LABEL_KEY: Record<OrderStatus, string> = {
  PENDING: "ordersBoard.pending",
  CUTTING: "ordersBoard.cutting",
  STITCHING: "ordersBoard.stitching",
  READY: "ordersBoard.ready",
  DELIVERED: "ordersBoard.delivered",
};

const STATUS_THEME: Record<
  OrderStatus,
  {
    lane: readonly [string, string];
    badge: string;
    badgeText: string;
    dot: string;
    cardBg: string;
    cardBorder: string;
    buttonBg: string;
  }
> = {
  PENDING: {
    lane: ["#e0ecff", "#f8fbff"],
    badge: "#1d4ed8",
    badgeText: "#dbeafe",
    dot: "#2563eb",
    cardBg: "#ffffff",
    cardBorder: "#bfdbfe",
    buttonBg: "#dbeafe",
  },
  CUTTING: {
    lane: ["#ffedd5", "#fff7ed"],
    badge: "#ea580c",
    badgeText: "#ffedd5",
    dot: "#f97316",
    cardBg: "#ffffff",
    cardBorder: "#fed7aa",
    buttonBg: "#ffedd5",
  },
  STITCHING: {
    lane: ["#cffafe", "#f0fdff"],
    badge: "#0f766e",
    badgeText: "#ccfbf1",
    dot: "#14b8a6",
    cardBg: "#ffffff",
    cardBorder: "#99f6e4",
    buttonBg: "#ccfbf1",
  },
  READY: {
    lane: ["#dcfce7", "#f7fee7"],
    badge: "#15803d",
    badgeText: "#dcfce7",
    dot: "#22c55e",
    cardBg: "#ffffff",
    cardBorder: "#bbf7d0",
    buttonBg: "#dcfce7",
  },
  DELIVERED: {
    lane: ["#e5e7eb", "#f8fafc"],
    badge: "#475569",
    badgeText: "#e2e8f0",
    dot: "#64748b",
    cardBg: "#ffffff",
    cardBorder: "#cbd5e1",
    buttonBg: "#e2e8f0",
  },
};

function formatRelativeDelivery(
  deliveryDate: number,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deliveryDate);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diff < 0) return t("ordersBoard.daysLate", { count: Math.abs(diff) });
  if (diff === 0) return t("ordersBoard.dueToday");
  if (diff === 1) return t("ordersBoard.dueTomorrow");
  return t("ordersBoard.daysLeft", { count: diff });
}

function OrderCard({
  order,
  onPress,
  onChangeStatus,
  showStatusAction = false,
}: {
  order: Order;
  onPress: () => void;
  onChangeStatus: () => void;
  showStatusAction?: boolean;
}) {
  const { t } = useTranslation();
  const theme = STATUS_THEME[order.status];
  const delivery = new Date(order.deliveryDate).toLocaleDateString();
  const remaining = Math.max(0, (order.price || 0) - (order.advance || 0));

  return (
    <Pressable onPress={onPress}>
      <Card
        className="mb-3 gap-3 rounded-3xl border p-0 overflow-hidden"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        }}
      >
        <View className="px-4 pt-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-950">
                {order.customer.name}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                #{order.orderNo} • {order.customer.phone}
              </Text>
            </View>

            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: theme.badge }}
            >
              <Text
                className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color: theme.badgeText }}
              >
                {t(STATUS_LABEL_KEY[order.status])}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4 gap-2">
          <View className="flex-row items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
            <View>
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("ordersBoard.delivery")}
              </Text>
              <Text className="mt-1 text-sm font-semibold text-slate-900">
                {delivery}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("ordersBoard.timeline")}
              </Text>
              <Text className="mt-1 text-sm font-semibold text-slate-900">
                {formatRelativeDelivery(order.deliveryDate, t)}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 rounded-2xl bg-slate-50 px-3 py-3">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("ordersBoard.price")}
              </Text>
              <Text className="mt-1 text-sm font-bold text-slate-950">
                Rs {order.price}
              </Text>
            </View>
            <View className="flex-1 rounded-2xl bg-slate-50 px-3 py-3">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("ordersBoard.remaining")}
              </Text>
              <Text className="mt-1 text-sm font-bold text-slate-950">
                Rs {remaining}
              </Text>
            </View>
          </View>
        </View>

        {showStatusAction ? (
          <View className="px-4 pb-4 pt-1">
            <Pressable
              onPress={onChangeStatus}
              className="h-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: theme.buttonBg }}
            >
              <Text className="font-semibold text-slate-900">
                {t("ordersBoard.changeStatus")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="px-4 pb-4 pt-1">
            <View className="h-11 items-center justify-center rounded-2xl bg-slate-100">
              <Text className="font-semibold text-slate-500">
                {t("ordersBoard.completed")}
              </Text>
            </View>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

export function OrdersBoardScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const [statusModal, setStatusModal] = useState<{
    orderId: string;
    current: OrderStatus;
  } | null>(null);

  const query = useQuery({
    queryKey: ["orders", "list"],
    queryFn: () => remoteApi.fetchOrders(),
  });

  const grouped = useMemo(() => {
    const orders = query.data ?? [];
    return Object.fromEntries(
      COLUMNS.map((column) => [
        column.status,
        orders.filter((order) => order.status === column.status),
      ]),
    ) as Record<OrderStatus, Order[]>;
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: async (vars: { id: string; status: OrderStatus }) => {
      const updated = await updateOrderStatusLocal(vars.id, vars.status);
      try {
        await remoteApi.updateOrderStatus(vars.id, vars.status);
      } catch {
        dispatch(
          enqueue({
            type: "orders/update",
            payload: { id: vars.id, status: vars.status },
          }),
        );
      }
      return updated;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["orders", "list"] });
      await qc.refetchQueries({ queryKey: ["orders", "list"], exact: true });
    },
  });

  const totalOrders = query.data?.length ?? 0;
  const activeOrders = (query.data ?? []).filter(
    (order) => order.status !== "DELIVERED",
  ).length;

  const changeStatus = async (id: string, status: OrderStatus) => {
    if (status === "DELIVERED") {
      const order = (query.data ?? []).find((item) => item.id === id);
      const remaining = Math.max(
        0,
        (order?.price ?? 0) - (order?.advance ?? 0),
      );
      if (remaining > 0) {
        Alert.alert(
          t("ordersBoard.cannotDeliverTitle"),
          t("ordersBoard.cannotDeliverMessage", { amount: remaining }),
        );
        return;
      }
    }
    setStatusModal(null);
    await mutation.mutateAsync({ id, status });
  };

  return (
    <Screen scroll={false} contentClassName="flex-1 bg-[#eef4ff]">
      <LinearGradient
        colors={["#0f172a", "#1d4ed8", "#38bdf8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          margin: 16,
          marginBottom: 12,
          borderRadius: 28,
          padding: 18,
        }}
      >
        <View className="gap-4">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-2xl font-black text-white">
                {t("ordersBoard.title")}
              </Text>
              <Text className="mt-2 text-sm leading-5 text-white/80">
                {t("ordersBoard.heroDescription")}
              </Text>
            </View>

            <View className="rounded-2xl bg-white/15 px-4 py-3">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                {t("ordersBoard.active")}
              </Text>
              <Text className="mt-1 text-2xl font-black text-white">
                {activeOrders}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-white px-4 py-3">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("ordersBoard.totalOrdersCard")}
              </Text>
              <Text className="mt-1 text-2xl font-black text-slate-950">
                {totalOrders}
              </Text>
            </View>
            <View className="flex-1 rounded-2xl bg-white/15 px-4 py-3">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                {t("ordersBoard.refreshState")}
              </Text>
              <Text className="mt-1 text-base font-bold text-white">
                {query.isFetching ? t("ordersBoard.updating") : t("common.live")}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        className="flex-1"
        contentContainerClassName="px-4 gap-4 pb-[6rem]"
        showsHorizontalScrollIndicator={false}
      >
        {COLUMNS.map((column) => {
          const theme = STATUS_THEME[column.status];
          const orders = grouped[column.status] ?? [];

          return (
            <LinearGradient
              key={column.status}
              colors={theme.lane as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 310,
                borderRadius: 28,
                padding: 14,
              }}
            >
              <View className="flex-1">
                <View className="mb-3 rounded-3xl bg-white/70 px-4 py-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: theme.dot }}
                      />
                      <Text className="text-sm font-bold uppercase tracking-wide text-slate-900">
                        {t(column.tKey)}
                      </Text>
                    </View>

                    <View
                      className="rounded-full px-3 py-1"
                      style={{ backgroundColor: theme.badge }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: theme.badgeText }}
                      >
                        {orders.length}
                      </Text>
                    </View>
                  </View>

                  <Text className="mt-2 text-xs text-slate-500">
                    {column.status === "PENDING"
                      ? t("ordersBoard.lanePending")
                      : column.status === "CUTTING"
                        ? t("ordersBoard.laneCutting")
                        : column.status === "STITCHING"
                          ? t("ordersBoard.laneStitching")
                          : column.status === "READY"
                            ? t("ordersBoard.laneReady")
                            : t("ordersBoard.laneDelivered")}
                  </Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {orders.length === 0 ? (
                    <View className="rounded-3xl bg-white/60 px-4 py-8 items-center">
                      <Text className="text-sm font-semibold text-slate-700">
                        {t("ordersBoard.noOrdersTitle")}
                      </Text>
                      <Text className="mt-1 text-xs text-slate-500 text-center">
                        {t("ordersBoard.noOrdersDescription")}
                      </Text>
                    </View>
                  ) : (
                    orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onPress={() => router.push(`/order/${order.id}`)}
                        onChangeStatus={() =>
                          setStatusModal({
                            orderId: order.id,
                            current: order.status,
                          })
                        }
                        showStatusAction={order.status !== "DELIVERED"}
                      />
                    ))
                  )}
                </ScrollView>
              </View>
            </LinearGradient>
          );
        })}
      </ScrollView>

      <Modal transparent visible={!!statusModal} animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 p-6"
          onPress={() => setStatusModal(null)}
        >
          <Pressable className="w-full rounded-3xl bg-white p-4">
            <Text className="mb-3 text-base font-bold text-slate-950">
              {t("ordersBoard.changeStatus")}
            </Text>

            <View className="gap-2">
              {COLUMNS.map((column) => {
                const theme = STATUS_THEME[column.status];
                const isActive = statusModal?.current === column.status;

                return (
                  <Pressable
                    key={column.status}
                    className="rounded-2xl px-4 py-4"
                    style={{
                      backgroundColor: isActive ? theme.badge : theme.buttonBg,
                    }}
                    onPress={() =>
                      statusModal
                        ? changeStatus(statusModal.orderId, column.status)
                        : undefined
                    }
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="font-semibold"
                        style={{ color: isActive ? theme.badgeText : "#0f172a" }}
                      >
                        {t(column.tKey)}
                      </Text>
                      <View
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: isActive ? theme.badgeText : theme.dot,
                        }}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
