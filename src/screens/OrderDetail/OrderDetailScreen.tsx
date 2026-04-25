import React from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { Screen } from "@/src/components/common/Screen";
import { Card } from "@/src/components/common/Card";
import { SectionHeader } from "@/src/components/common/SectionHeader";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";
import { remoteApi } from "@/src/api/remoteApi";
import { addPaymentLocal, removeOrderLocal } from "@/src/api/ordersRepository";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { enqueue } from "@/src/store/slices/offlineQueueSlice";
import type { Garment, OrderStatus } from "@/src/types/order";
import {
  callPhone,
  openWhatsApp,
  sendSms,
} from "@/src/utils/contactActions";
import {
  GARMENT_LABEL_KEY,
  GARMENT_MEASUREMENT_FIELDS,
  MEASUREMENT_LABEL_KEYS,
} from "@/src/constants/measurementFields";
import { buildMeasurementSlipHtml } from "@/src/utils/measurementSlip";
import { parsePositiveNumber } from "@/src/utils/validation";

const STATUS_LABEL_KEY: Record<OrderStatus, string> = {
  PENDING: "ordersBoard.pending",
  CUTTING: "ordersBoard.cutting",
  STITCHING: "ordersBoard.stitching",
  READY: "ordersBoard.ready",
  DELIVERED: "ordersBoard.delivered",
};

const STATUS_STEP_ORDER: OrderStatus[] = [
  "PENDING",
  "CUTTING",
  "STITCHING",
  "READY",
  "DELIVERED",
];

function currency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(value);
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="flex-1 text-sm text-slate-500">{label}</Text>
      <Text className="max-w-[55%] text-right text-sm font-semibold text-slate-950">
        {value}
      </Text>
    </View>
  );
}

function GarmentCard({
  garment,
  t,
}: {
  garment: Garment;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const measurements = GARMENT_MEASUREMENT_FIELDS[garment.type]
    .map((field) => ({
      key: field,
      value: garment.measurements[field],
    }))
    .filter((item) => item.value != null);

  const stylingItems = [
    garment.styling.sidePocket != null
      ? {
          label: t("orderDetail.sidePocket"),
          value: garment.styling.sidePocket
            ? t("orderDetail.yes")
            : t("orderDetail.no"),
        }
      : null,
    garment.styling.collarType
      ? {
          label: t("orderDetail.collarType"),
          value: garment.styling.collarType,
        }
      : null,
    garment.styling.cuffSize
      ? {
          label: t("orderDetail.cuffSize"),
          value: garment.styling.cuffSize,
        }
      : null,
    garment.styling.frontPocket
      ? {
          label: t("orderDetail.frontPocket"),
          value: garment.styling.frontPocket,
        }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <View className="gap-3 rounded-3xl bg-slate-50 p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-slate-950">
          {t(GARMENT_LABEL_KEY[garment.type])}
        </Text>
        <View className="rounded-full bg-slate-900 px-3 py-1">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-white">
            {t("orderDetail.stitchingDetails")}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t("newOrder.measurements")}
        </Text>
        {measurements.length > 0 ? (
          measurements.map((item) => (
            <DetailRow
              key={item.key}
              label={t(MEASUREMENT_LABEL_KEYS[item.key] ?? item.key)}
              value={String(item.value)}
            />
          ))
        ) : (
          <Text className="text-sm text-slate-500">{t("orderDetail.noMeasurements")}</Text>
        )}
      </View>

      <View className="h-px bg-slate-200" />

      <View className="gap-3 rounded-2xl bg-amber-50 p-4">
        <Text className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          {t("orderDetail.stitchingDetails")}
        </Text>
        {stylingItems.length > 0 ? (
          <>
            <View className="flex-row flex-wrap gap-2">
              {stylingItems.map((item) => (
                <View
                  key={item.label}
                  className="rounded-full border border-amber-200 bg-white px-3 py-2"
                >
                  <Text className="text-xs font-semibold text-amber-700">
                    {item.label}
                  </Text>
                  <Text className="mt-1 text-sm font-bold text-slate-950">
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
            {garment.styling.sidePocket != null ? (
              <Text className="text-xs text-slate-500">
                {garment.styling.sidePocket
                  ? t("newOrder.sidePocketOn")
                  : t("newOrder.sidePocketOff")}
              </Text>
            ) : null}
          </>
        ) : (
          <Text className="text-sm text-slate-500">{t("orderDetail.noStyling")}</Text>
        )}
      </View>
    </View>
  );
}

export function OrderDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  const qc = useQueryClient();
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [paymentError, setPaymentError] = React.useState("");

  const query = useQuery({
    queryKey: ["orders", "list"],
    queryFn: () => remoteApi.fetchOrders(),
  });

  const order = (query.data ?? []).find((o) => o.id === id);
  const remaining = Math.max(0, (order?.price || 0) - (order?.advance || 0));
  const totalPaid =
    order?.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) ?? 0;
  const statusIndex = order ? STATUS_STEP_ORDER.indexOf(order.status) : -1;

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
            }),
          );
        }
      } else {
        dispatch(
          enqueue({
            type: "orders/delete",
            payload: { id: order.id },
          }),
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

  const createSlipHtml = () => {
    if (!order) return "";
    return buildMeasurementSlipHtml({
      order,
      profile: settings.profile,
      unit: settings.unit,
      t,
    });
  };

  const onShareMeasurementSlip = async () => {
    if (!order) return;

    try {
      const html = createSlipHtml();
      const file = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(
          t("orderDetail.measurementSlip"),
          t("orderDetail.shareUnavailable"),
        );
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        dialogTitle: t("orderDetail.shareSlip"),
        UTI: "com.adobe.pdf",
      });
    } catch {
      Alert.alert(
        t("orderDetail.measurementSlip"),
        t("orderDetail.measurementSlipError"),
      );
    }
  };

  const onPrintMeasurementSlip = async () => {
    if (!order) return;

    try {
      await Print.printAsync({
        html: createSlipHtml(),
      });
    } catch {
      Alert.alert(
        t("orderDetail.measurementSlip"),
        t("orderDetail.measurementSlipError"),
      );
    }
  };

  const addPaymentMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!order) return undefined;
      const updated = await addPaymentLocal(order.id, amount);
      if (!updated) return undefined;

      const net = await NetInfo.fetch();
      if (!!net.isConnected) {
        try {
          await remoteApi.updateOrder(updated);
        } catch {
          dispatch(
            enqueue({
              type: "orders/addPayment",
              payload: updated,
            }),
          );
        }
      } else {
        dispatch(
          enqueue({
            type: "orders/addPayment",
            payload: updated,
          }),
        );
      }

      return updated;
    },
    onSuccess: async () => {
      setPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentError("");
      await qc.invalidateQueries({ queryKey: ["orders", "list"] });
      await qc.refetchQueries({ queryKey: ["orders", "list"], exact: true });
      Alert.alert(t("common.save"), t("orderDetail.paymentAdded"));
    },
  });

  const onAddPayment = async () => {
    const parsedAmount = parsePositiveNumber(paymentAmount);
    if (parsedAmount == null || parsedAmount <= 0) {
      setPaymentError(t("orderDetail.invalidPaymentAmount"));
      return;
    }
    if (parsedAmount > remaining) {
      setPaymentError(t("orderDetail.paymentTooHigh"));
      return;
    }

    await addPaymentMutation.mutateAsync(parsedAmount);
  };

  return (
    <Screen contentClassName="p-4 gap-4 bg-[#f5f7fb]" scroll>
      <SectionHeader title={`#${order?.orderNo ?? ""}`} />

      {!order ? (
        <Text className="text-sm text-gray-500">{t("common.loading")}</Text>
      ) : (
        <>
          <LinearGradient
            colors={["#0f172a", "#1d4ed8", "#38bdf8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 28, padding: 18 }}
          >
            <View className="gap-4">
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-[2px] text-white/70">
                    {t("orderDetail.customerSummary")}
                  </Text>
                  <Text className="mt-2 text-3xl font-black text-white">
                    #{order.orderNo}
                  </Text>
                  <Text className="mt-2 text-sm text-white/80">
                    {order.customer.name}
                  </Text>
                  <Text className="mt-1 text-sm text-white/70">
                    {order.customer.phone}
                  </Text>
                </View>
                <View className="rounded-2xl bg-white/15 px-4 py-3">
                  <Text className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                    {t("ordersBoard.status")}
                  </Text>
                  <Text className="mt-1 text-base font-bold text-white">
                    {t(STATUS_LABEL_KEY[order.status])}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 rounded-2xl bg-white px-4 py-3">
                  <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {t("ordersBoard.delivery")}
                  </Text>
                  <Text className="mt-1 text-base font-bold text-slate-950">
                    {new Date(order.deliveryDate).toLocaleDateString()}
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl bg-white/15 px-4 py-3">
                  <Text className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                    {t("orderDetail.totalPaid")}
                  </Text>
                  <Text className="mt-1 text-base font-bold text-white">
                    Rs {currency(totalPaid)}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <Card className="gap-3 border-0 bg-[#fff7ed]">
            <SectionHeader title={t("orderDetail.customerSummary")} />
            <View className="gap-3 rounded-2xl bg-white/80 p-4">
              <Text className="text-base font-semibold text-black">
                {order.customer.name}
              </Text>
              <Text className="text-sm text-gray-600">{order.customer.phone}</Text>
            </View>
            <DetailRow
              label={t("orderDetail.orderNumber")}
              value={`#${order.orderNo}`}
            />
            <DetailRow
              label={t("ordersBoard.delivery")}
              value={new Date(order.deliveryDate).toLocaleDateString()}
            />
            <DetailRow
              label={t("orderDetail.createdOn")}
              value={new Date(order.createdAt).toLocaleString()}
            />
            <DetailRow
              label={t("orderDetail.updatedOn")}
              value={new Date(order.updatedAt).toLocaleString()}
            />
            <DetailRow
              label={t("ordersBoard.status")}
              value={t(STATUS_LABEL_KEY[order.status])}
            />
          </Card>

          <Card className="gap-3 border-0 bg-[#ecfeff]">
            <SectionHeader title={t("orderDetail.orderProgress")} />
            <View className="gap-3">
              {STATUS_STEP_ORDER.map((status, index) => {
                const active = index <= statusIndex;
                const current = order.status === status;

                return (
                  <View
                    key={status}
                    className={`rounded-2xl px-4 py-3 ${
                      current
                        ? "bg-slate-900"
                        : active
                          ? "bg-emerald-50"
                          : "bg-slate-50"
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className={`font-semibold ${
                          current
                            ? "text-white"
                            : active
                              ? "text-emerald-700"
                              : "text-slate-500"
                        }`}
                      >
                        {t(STATUS_LABEL_KEY[status])}
                      </Text>
                      <Text
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          current
                            ? "text-white/80"
                            : active
                              ? "text-emerald-700"
                              : "text-slate-400"
                        }`}
                      >
                        {current
                          ? t("orderDetail.currentStage")
                          : active
                            ? t("orderDetail.completedStage")
                            : t("orderDetail.pendingStage")}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>

          <Card className="gap-3 border-0 bg-[#f5f3ff]">
            <SectionHeader title={t("newOrder.orderDetails")} />
            <View className="flex-row flex-wrap gap-3">
              <View className="min-w-[47%] flex-1 rounded-2xl bg-white px-4 py-4">
                <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {t("newOrder.price")}
                </Text>
                <Text className="mt-1 text-xl font-black text-slate-950">
                  Rs {currency(order.price || 0)}
                </Text>
              </View>
              <View className="min-w-[47%] flex-1 rounded-2xl bg-white px-4 py-4">
                <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {t("newOrder.advance")}
                </Text>
                <Text className="mt-1 text-xl font-black text-slate-950">
                  Rs {currency(order.advance || 0)}
                </Text>
              </View>
              <View className="min-w-[47%] flex-1 rounded-2xl bg-emerald-50 px-4 py-4">
                <Text className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  {t("orderDetail.totalPaid")}
                </Text>
                <Text className="mt-1 text-xl font-black text-slate-950">
                  Rs {currency(totalPaid)}
                </Text>
              </View>
              <View className="min-w-[47%] flex-1 rounded-2xl bg-rose-50 px-4 py-4">
                <Text className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                  {t("newOrder.remaining")}
                </Text>
                <Text className="mt-1 text-xl font-black text-slate-950">
                  Rs {currency(remaining)}
                </Text>
              </View>
            </View>
          </Card>

          <Card className="gap-3 border-0 bg-[#f0fdf4]">
            <SectionHeader
              title={t("newOrder.payments")}
              right={
                remaining > 0 ? (
                  <Pressable
                    className="rounded-full bg-emerald-600 px-3 py-2"
                    onPress={() => setPaymentModalOpen(true)}
                  >
                    <Text className="text-xs font-semibold text-white">
                      {t("orderDetail.addPayment")}
                    </Text>
                  </Pressable>
                ) : null
              }
            />
            {order.payments?.length ? (
              order.payments
                .slice()
                .sort((a, b) => b.paidAt - a.paidAt)
                .map((payment, index) => (
                  <View
                    key={payment.id}
                    className={`rounded-2xl px-4 py-3 ${
                      index % 2 === 0 ? "bg-slate-50" : "bg-emerald-50"
                    }`}
                  >
                    <DetailRow
                      label={t("orderDetail.paymentAmount")}
                      value={`Rs ${currency(payment.amount || 0)}`}
                    />
                    <DetailRow
                      label={t("orderDetail.paymentDate")}
                      value={new Date(payment.paidAt).toLocaleString()}
                    />
                  </View>
                ))
            ) : (
              <Text className="text-sm text-slate-500">{t("orderDetail.noPayments")}</Text>
            )}
          </Card>

          <Card className="gap-3 border-0 bg-[#fffaf0]">
            <SectionHeader title={t("orderDetail.garmentsAndStitching")} />
            {order.garments?.length ? (
              order.garments.map((garment) => (
                <GarmentCard key={garment.id} garment={garment} t={t} />
              ))
            ) : (
              <Text className="text-sm text-slate-500">{t("orderDetail.noGarments")}</Text>
            )}
          </Card>

          {order.notes ? (
            <Card className="gap-2 border-0 bg-white">
              <SectionHeader title={t("newOrder.notes")} />
              <Text className="text-sm text-gray-700">{order.notes}</Text>
            </Card>
          ) : null}

          <Card className="gap-3 border-0 bg-[#fef3c7]">
            <SectionHeader title={t("orderDetail.measurementSlip")} />
            <Text className="text-sm leading-6 text-slate-600">
              {t("orderDetail.measurementSlipDescription")}
            </Text>
            <Button
              title={t("orderDetail.printSlip")}
              variant="secondary"
              onPress={() => {
                void onPrintMeasurementSlip();
              }}
            />
            <Button
              title={t("orderDetail.shareSlip")}
              onPress={() => {
                void onShareMeasurementSlip();
              }}
            />
          </Card>

          <Card className="gap-3 border-0 bg-[#eff6ff]">
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

          <Card className="gap-3 border-0 bg-[#f8fafc]">
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

          <Modal transparent visible={paymentModalOpen} animationType="fade">
            <Pressable
              className="flex-1 items-center justify-center bg-black/40 p-6"
              onPress={() => {
                setPaymentModalOpen(false);
                setPaymentError("");
              }}
            >
              <Pressable className="w-full rounded-3xl bg-white p-5">
                <Text className="text-lg font-bold text-slate-950">
                  {t("orderDetail.addPayment")}
                </Text>
                <Text className="mt-2 text-sm text-slate-500">
                  {t("orderDetail.addPaymentDescription", {
                    amount: currency(remaining),
                  })}
                </Text>
                <View className="mt-4 gap-3">
                  <Input
                    label={t("orderDetail.paymentAmount")}
                    value={paymentAmount}
                    onChangeText={(value) => {
                      setPaymentAmount(value);
                      if (paymentError) setPaymentError("");
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    error={paymentError}
                  />
                  <Button
                    title={t("orderDetail.addPayment")}
                    onPress={() => {
                      void onAddPayment();
                    }}
                    loading={addPaymentMutation.isPending}
                  />
                  <Button
                    title={t("common.cancel")}
                    variant="secondary"
                    onPress={() => {
                      setPaymentModalOpen(false);
                      setPaymentError("");
                    }}
                  />
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      )}
    </Screen>
  );
}
