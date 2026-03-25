import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Screen } from "@/src/components/common/Screen";
import { Card } from "@/src/components/common/Card";
import { SectionHeader } from "@/src/components/common/SectionHeader";
import type { Order, OrderStatus } from "@/src/types/order";
import {
  listOrders,
  updateOrderStatusLocal,
} from "@/src/api/ordersRepository";
import { useAppDispatch } from "@/src/store/hooks";
import { enqueue } from "@/src/store/slices/offlineQueueSlice";

const COLUMNS: { status: OrderStatus; tKey: string }[] = [
  { status: "PENDING", tKey: "ordersBoard.pending" },
  { status: "CUTTING", tKey: "ordersBoard.cutting" },
  { status: "STITCHING", tKey: "ordersBoard.stitching" },
  { status: "READY", tKey: "ordersBoard.ready" },
  { status: "DELIVERED", tKey: "ordersBoard.delivered" },
];

function OrderCard({
  order,
  onPress,
  onChangeStatus,
}: {
  order: Order;
  onPress: () => void;
  onChangeStatus: () => void;
}) {
  const { t } = useTranslation();
  const delivery = new Date(order.deliveryDate).toLocaleDateString();
  return (
    <Pressable onPress={onPress}>
      <Card className="gap-2 bg-slate-50 mb-3">
        <Text className="text-base font-semibold text-black">
          {order.customer.name} · #{order.orderNo}
        </Text>
        <Text className="text-sm text-gray-600">
          {t("ordersBoard.delivery")}: {delivery}
        </Text>
        <Text className="text-sm text-gray-600">
          {t("ordersBoard.phone")}: {order.customer.phone}
        </Text>
        <Pressable
          onPress={onChangeStatus}
          className="mt-1 h-10 rounded-xl bg-black/5 items-center justify-center"
        >
          <Text className="font-semibold">{t("ordersBoard.changeStatus")}</Text>
        </Pressable>
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
    queryFn: listOrders,
  });

  const grouped = useMemo(() => {
    const orders = query.data ?? [];
    return Object.fromEntries(
      COLUMNS.map((c) => [c.status, orders.filter((o) => o.status === c.status)])
    ) as Record<OrderStatus, Order[]>;
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: async (vars: { id: string; status: OrderStatus }) => {
      const updated = await updateOrderStatusLocal(vars.id, vars.status);
      return updated;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["orders", "list"] });
    },
  });

  const changeStatus = async (id: string, status: OrderStatus) => {
    setStatusModal(null);
    await mutation.mutateAsync({ id, status });
    dispatch(
      enqueue({
        type: "orders/updateStatus",
        payload: { id, status },
      })
    );
  };

  return (
    <Screen scroll={false} contentClassName="flex-1 bg-slate-50">
      <View className="p-4">
        <SectionHeader title={t("ordersBoard.title")} />
      </View>

      <ScrollView
  horizontal
  className="flex-1"
  contentContainerClassName="px-4 gap-4 pb-[6rem]"
  showsHorizontalScrollIndicator={false}
>
  {COLUMNS.map((col) => (
    <View
      key={col.status}
      className={`w-[280px] rounded-2xl p-3 border border-gray-200 ${
        col.status === "PENDING"
          ? "bg-indigo-100"
          : col.status === "CUTTING"
          ? "bg-amber-200"
          : col.status === "STITCHING"
          ? "bg-blue-200"
          : col.status === "READY"
          ? "bg-green-200"
          : "bg-gray-200"
      }`}
    >
      <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {t(col.tKey)} ({grouped[col.status]?.length ?? 0})
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {(grouped[col.status] ?? []).map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            onPress={() => router.push(`/order/${o.id}`)}
            onChangeStatus={() =>
              setStatusModal({ orderId: o.id, current: o.status })
            }
          />
        ))}
      </ScrollView>
    </View>
  ))}
</ScrollView>

      <Modal transparent visible={!!statusModal} animationType="fade">
        <Pressable
          className="flex-1 bg-black/40 items-center justify-center p-6"
          onPress={() => setStatusModal(null)}
        >
          <Pressable className="w-full rounded-2xl bg-white p-4 gap-2">
            <Text className="text-base font-semibold text-black">
              {t("ordersBoard.changeStatus")}
            </Text>
            {COLUMNS.map((c) => (
              <Pressable
                key={c.status}
                className={`h-12 rounded-xl items-center justify-center ${
                  statusModal?.current === c.status ? "bg-black" : "bg-gray-100"
                }`}
                onPress={() =>
                  statusModal
                    ? changeStatus(statusModal.orderId, c.status)
                    : undefined
                }
              >
                <Text
                  className={`font-semibold ${
                    statusModal?.current === c.status ? "text-white" : "text-black"
                  }`}
                >
                  {t(c.tKey)}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

