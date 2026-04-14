import React, { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Platform, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { nanoid } from "@reduxjs/toolkit";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import NetInfo from "@react-native-community/netinfo";

import { Screen } from "@/src/components/common/Screen";
import { Card } from "@/src/components/common/Card";
import { SectionHeader } from "@/src/components/common/SectionHeader";
import { Input } from "@/src/components/common/Input";
import { Button } from "@/src/components/common/Button";
import { MeasurementInput } from "@/src/components/measurement/MeasurementInput";
import {
  GARMENT_LABEL_KEY,
  GARMENT_MEASUREMENT_FIELDS,
  MEASUREMENT_LABEL_KEYS,
} from "@/src/constants/measurementFields";

import type { Garment, GarmentType, Order } from "@/src/types/order";
import {
  createOrderLocal,
  getOrderById,
  listOrdersByCustomerPhone,
  removeOrderLocal,
  upsertOrderLocal,
  updateOrderLocal,
} from "@/src/api/ordersRepository";
import { isValidPhone } from "@/src/utils/validation";
import { useAppDispatch } from "@/src/store/hooks";
import { enqueue } from "@/src/store/slices/offlineQueueSlice";
import { remoteApi } from "@/src/api/remoteApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/src/constants/storageKeys";

type SaveMode = "create" | "update";
type SaveResult = {
  order?: Order;
  mode: SaveMode;
};

function emptyGarment(type: GarmentType): Garment {
  return {
    id: nanoid(),
    type,
    measurements: {},
    styling: {
      sidePocket: false,
    },
  };
}

export function NewOrderScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{
    phone?: string;
    copyOrderId?: string;
    editOrderId?: string;
  }>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  });
  const [price, setPrice] = useState("");
  const [advance, setAdvance] = useState("");
  const [garments, setGarments] = useState<Garment[]>([]);
  const [garmentPickerOpen, setGarmentPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const isEditMode =
    typeof params.editOrderId === "string" && params.editOrderId.length > 0;

  const phoneValid = isValidPhone(phone);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    deliveryDate?: string;
    price?: string;
    advance?: string;
  }>({});

  useEffect(() => {
    if (params.phone && typeof params.phone === "string") {
      setPhone(params.phone);
    }
  }, [params.phone]);

  useEffect(() => {
    const run = async () => {
      if (!isEditMode || typeof params.editOrderId !== "string") return;
      const existing =
        (await getOrderById(params.editOrderId)) ??
        (await remoteApi.fetchOrders()).find((item) => item.id === params.editOrderId);
      if (!existing) return;
      await upsertOrderLocal(existing);
      setEditingOrder(existing);
      setName(existing.customer.name);
      setPhone(existing.customer.phone);
      setNotes(existing.notes ?? "");
      setDeliveryDate(new Date(existing.deliveryDate));
      setPrice(String(existing.price ?? ""));
      setAdvance(String(existing.advance ?? ""));
      setGarments(existing.garments ?? []);
    };
    void run();
  }, [isEditMode, params.editOrderId]);

  useEffect(() => {
    if (isEditMode) return;
    const run = async () => {
      if (!params.copyOrderId || typeof params.copyOrderId !== "string") return;
      const existing = await getOrderById(params.copyOrderId);
      if (!existing) return;
      setName(existing.customer.name);
      setPhone(existing.customer.phone);
      setGarments(
        (existing.garments ?? []).map((g) => ({
          ...g,
          id: nanoid(),
        }))
      );
    };
    void run();
  }, [isEditMode, params.copyOrderId]);

  const historyQuery = useQuery({
    queryKey: ["customers", "history", phone],
    enabled: phoneValid && phone.trim().length > 0,
    queryFn: () => listOrdersByCustomerPhone(phone.replace(/\s+/g, "")),
  });

  const remaining = useMemo(() => {
    const p = Number(price) || 0;
    const a = Number(advance) || 0;
    return Math.max(0, p - a);
  }, [price, advance]);

  const datePickerMinimumDate = useMemo(() => {
    if (isEditMode) {
      return undefined;
    }
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    return minDate;
  }, [isEditMode]);

  const saveMutation = useMutation<SaveResult>({
    mutationFn: async () => {
      const p = phone.replace(/\s+/g, "");
      const priceN = Number(price) || 0;
      const advanceN = Number(advance) || 0;
      const deviceToken =
        editingOrder?.deviceToken ??
        ((await AsyncStorage.getItem(STORAGE_KEYS.pushToken)) ?? undefined);

      const draft: Omit<Order, "id" | "orderNo" | "createdAt" | "updatedAt"> = {
        customer: { name: name.trim(), phone: p },
        status: editingOrder?.status ?? "PENDING",
        deliveryDate: deliveryDate.getTime(),
        garments,
        notes: notes.trim() ? notes.trim() : undefined,
        drawingSvgPath: editingOrder?.drawingSvgPath,
        fabricPhotoUris: editingOrder?.fabricPhotoUris ?? [],
        price: priceN,
        advance: advanceN,
        payments:
          editingOrder?.payments ??
          (advanceN > 0
            ? [{ id: nanoid(), amount: advanceN, paidAt: Date.now() }]
            : []),
        deviceToken,
      };

      if (editingOrder) {
        return {
          order: await updateOrderLocal(editingOrder.id, draft),
          mode: "update",
        };
      }

      return {
        order: await createOrderLocal(draft),
        mode: "create",
      };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["orders", "list"] });
      // Alerts + clearing are handled in onSave so we can decide online/offline behavior.
    },
  });

  const onSave = async () => {
    const nextErrors: typeof errors = {};

    if (!name.trim()) {
      nextErrors.name = t("common.required");
    }

    const trimmedPhone = phone.replace(/\s+/g, "");
    if (!trimmedPhone) {
      nextErrors.phone = t("common.required");
    } else if (!isValidPhone(trimmedPhone)) {
      nextErrors.phone = t("newOrder.invalidPhone");
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (!isEditMode && deliveryDate.getTime() < todayStart.getTime()) {
      nextErrors.deliveryDate = t("common.required");
    }

    if (!price.trim()) {
      nextErrors.price = t("common.required");
    }

    if (!advance.trim()) {
      nextErrors.advance = t("common.required");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    const result = await saveMutation.mutateAsync();
    const order = result.order;
    const mode = result.mode;
    if (!order) return;
    const net = await NetInfo.fetch();
    const online = !!net.isConnected;

    if (online) {
      try {
        if (mode === "update") {
          await remoteApi.updateOrder(order);
          await qc.invalidateQueries({ queryKey: ["orders", "list"] });
          await qc.refetchQueries({ queryKey: ["orders", "list"], exact: true });
        } else {
          await remoteApi.createOrder(order);
          await removeOrderLocal(order.id);
        }
        Alert.alert(
          t("common.save"),
          mode === "update"
            ? t("newOrder.updatedSuccess")
            : t("newOrder.createdSuccess"),
        );
        router.push("/(tabs)/orders");
      } catch {
        dispatch(
          enqueue({
            type: mode === "update" ? "orders/updateOrder" : "orders/create",
            payload: order,
          })
        );
        Alert.alert(
          t("common.save"),
          t("newOrder.offlineFallback")
        );
      }
    } else {
      dispatch(
        enqueue({
          type: mode === "update" ? "orders/updateOrder" : "orders/create",
          payload: order,
        })
      );
      Alert.alert(
        t("common.save"),
        mode === "update"
          ? t("newOrder.offlineUpdateSaved")
          : t("newOrder.savedOffline"),
      );
    }

    setName("");
    setPhone("");
    setNotes("");
    setPrice("");
    setAdvance("");
    setGarments([]);
    setEditingOrder(null);
  };

  const canCopy = (historyQuery.data?.length ?? 0) > 0;
  const copyFromPrevious = () => {
    const last = historyQuery.data?.[0];
    if (!last) return;
    setGarments(
      (last.garments ?? []).map((g) => ({
        ...g,
        id: nanoid(),
      }))
    );
  };

  return (
    <Screen contentClassName="p-4 gap-4 mb-[10rem] pb-[6rem] bg-[#f5f7fb]" scroll>
      <LinearGradient
        colors={["#111827", "#7c3aed", "#ec4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28, padding: 18 }}
      >
        <Text className="text-xs font-semibold uppercase tracking-[2px] text-white/70">
          {t("newOrder.heroEyebrow")}
        </Text>
        <Text className="mt-2 text-3xl font-black text-white">
          {isEditMode ? t("newOrder.editTitle") : t("newOrder.title")}
        </Text>
        <Text className="mt-2 text-sm leading-5 text-white/80">
          {t("newOrder.heroDescription")}
        </Text>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-white px-4 py-3">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {t("newOrder.garments")}
            </Text>
            <Text className="mt-1 text-2xl font-black text-slate-950">
              {garments.length}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white/15 px-4 py-3">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
              {t("newOrder.remaining")}
            </Text>
            <Text className="mt-1 text-2xl font-black text-white">
              Rs {remaining}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <Card className="gap-3 border-0 bg-white">
        <SectionHeader
          title={t("newOrder.customerInfo")}
          right={
            canCopy ? (
              <Pressable
                className="px-3 py-2 rounded-full bg-slate-900"
                onPress={copyFromPrevious}
              >
                <Text className="text-xs font-semibold text-white">
                  {t("newOrder.copyFromPrevious")}
                </Text>
              </Pressable>
            ) : null
          }
        />
        <Input
          label={t("newOrder.customerName")}
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder={t("newOrder.customerName")}
          error={errors.name}
        />
        <View className="gap-2">
          <Input
            label={t("newOrder.phone")}
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            placeholder="03xxxxxxxxx"
            keyboardType="phone-pad"
            error={errors.phone}
          />
          {canCopy ? (
            <Pressable
              className="h-12 rounded-xl bg-gray-100 items-center justify-center"
              onPress={() => router.push(`/customer/${phone.replace(/\s+/g, "")}`)}
            >
              <Text className="font-semibold text-black">
                {t("newOrder.viewHistory")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Card>

      <Card className="gap-3 border-0 bg-white">
        <SectionHeader
          title={t("newOrder.garments")}
          right={
            <Pressable
              className="rounded-full bg-slate-900 px-3 py-2"
              onPress={() => setGarmentPickerOpen(true)}
            >
              <Text className="text-sm font-semibold text-white">
                {t("newOrder.addGarment")}
              </Text>
            </Pressable>
          }
        />

        {garments.length === 0 ? (
          <Text className="text-sm text-gray-500">
            {t("newOrder.addGarment")}
          </Text>
        ) : null}

        {garments.map((g) => (
          <View key={g.id} className="gap-3 rounded-3xl bg-slate-50 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-black">
                {t(GARMENT_LABEL_KEY[g.type])}
              </Text>
              <Pressable
                onPress={() =>
                  setGarments((prev) => prev.filter((x) => x.id !== g.id))
                }
              >
                <Text className="text-sm font-semibold text-red-600">
                  {t("common.delete")}
                </Text>
              </Pressable>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                className={`px-3 py-1 rounded-full border ${
                  g.styling?.sidePocket
                    ? "bg-green-600 border-green-600"
                    : "bg-white border-gray-300"
                }`}
                onPress={() =>
                  setGarments((prev) =>
                    prev.map((x) =>
                      x.id === g.id
                        ? {
                            ...x,
                            styling: {
                              ...x.styling,
                              sidePocket: !x.styling?.sidePocket,
                            },
                          }
                        : x
                    )
                  )
                }
              >
                <Text
                  className={`text-xs font-semibold ${
                    g.styling?.sidePocket ? "text-white" : "text-gray-800"
                  }`}
                >
                  {g.styling?.sidePocket
                    ? t("newOrder.sidePocketOn")
                    : t("newOrder.sidePocketOff")}
                </Text>
              </Pressable>
            </View>

            {GARMENT_MEASUREMENT_FIELDS[g.type].map((field) => (
              <MeasurementInput
                key={field}
                labelKey={MEASUREMENT_LABEL_KEYS[field] ?? field}
                value={g.measurements[field]}
                onChange={(next) =>
                  setGarments((prev) =>
                    prev.map((x) =>
                      x.id === g.id
                        ? {
                            ...x,
                            measurements: { ...x.measurements, [field]: next },
                          }
                        : x
                    )
                  )
                }
              />
            ))}
          </View>
        ))}
      </Card>

      <Card className="gap-3 border-0 bg-white">
        <SectionHeader title={t("newOrder.notes")} />
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder={t("newOrder.notes")}
          multiline
        />
      </Card>

      <Card className="gap-3 border-0 bg-white">
        <SectionHeader title={t("newOrder.orderDetails")} />
        <Pressable onPress={() => setDatePickerOpen(true)}>
          <View pointerEvents="none">
            <Input
              label={t("newOrder.deliveryDate")}
              value={deliveryDate.toLocaleDateString()}
              onChangeText={() => {}}
              placeholder={t("newOrder.deliveryDate")}
              error={errors.deliveryDate}
            />
          </View>
        </Pressable>
        {datePickerOpen ? (
          <DateTimePicker
            value={deliveryDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={datePickerMinimumDate}
            onChange={(event: DateTimePickerEvent, selected) => {
              if (Platform.OS !== "ios") setDatePickerOpen(false);
              if (event.type === "dismissed") return;
              if (selected) {
                setDeliveryDate(selected);
                if (errors.deliveryDate) {
                  setErrors((prev) => ({ ...prev, deliveryDate: undefined }));
                }
              }
            }}
          />
        ) : null}
        {Platform.OS === "ios" && datePickerOpen ? (
          <Button
            title={t("common.close")}
            variant="secondary"
            onPress={() => setDatePickerOpen(false)}
          />
        ) : null}
        <Input
          label={t("newOrder.price")}
          value={price}
          onChangeText={(v) => {
            setPrice(v);
            if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
          }}
          keyboardType="decimal-pad"
          placeholder="0"
          error={errors.price}
        />
        <Input
          label={t("newOrder.advance")}
          value={advance}
          onChangeText={(v) => {
            setAdvance(v);
            if (errors.advance) setErrors((prev) => ({ ...prev, advance: undefined }));
          }}
          keyboardType="decimal-pad"
          placeholder="0"
          error={errors.advance}
        />
        <View className="rounded-2xl bg-rose-50 px-4 py-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-rose-700">{t("newOrder.remaining")}</Text>
            <Text className="text-lg font-black text-rose-700">Rs {remaining}</Text>
          </View>
        </View>
      </Card>

      <Button
        title={isEditMode ? t("newOrder.updateCta") : t("common.save")}
        onPress={onSave}
        loading={saveMutation.isPending}
      />

      <Modal transparent visible={garmentPickerOpen} animationType="fade">
        <Pressable
          className="flex-1 bg-black/40 items-center justify-center p-6"
          onPress={() => setGarmentPickerOpen(false)}
        >
          <Pressable className="w-full rounded-3xl bg-white p-4 gap-2">
            {(["QAMEEZ", "SHALWAR", "WAISTCOAT"] as GarmentType[]).map((type) => (
              <Pressable
                key={type}
                className="h-12 rounded-2xl bg-slate-100 items-center justify-center"
                onPress={() => {
                  setGarments((prev) => [...prev, emptyGarment(type)]);
                  setGarmentPickerOpen(false);
                }}
              >
                <Text className="font-semibold text-black">
                  {t(GARMENT_LABEL_KEY[type])}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
