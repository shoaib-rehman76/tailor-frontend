import React, { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Platform, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { nanoid } from "@reduxjs/toolkit";
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
  markOrderSyncedLocal,
} from "@/src/api/ordersRepository";
import { isValidPhone } from "@/src/utils/validation";
import { useAppDispatch } from "@/src/store/hooks";
import { enqueue } from "@/src/store/slices/offlineQueueSlice";
import { remoteApi } from "@/src/api/remoteApi";

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
  const params = useLocalSearchParams<{ phone?: string; copyOrderId?: string }>();

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
  }, [params.copyOrderId]);

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const p = phone.replace(/\s+/g, "");
      const priceN = Number(price) || 0;
      const advanceN = Number(advance) || 0;

      const draft: Omit<Order, "id" | "orderNo" | "createdAt" | "updatedAt"> = {
        customer: { name: name.trim(), phone: p },
        status: "PENDING",
        deliveryDate: deliveryDate.getTime(),
        garments,
        notes: notes.trim() ? notes.trim() : undefined,
        drawingSvgPath: undefined,
        fabricPhotoUris: [],
        price: priceN,
        advance: advanceN,
        payments:
          advanceN > 0
            ? [{ id: nanoid(), amount: advanceN, paidAt: Date.now() }]
            : [],
      };

      return createOrderLocal(draft);
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
    if (deliveryDate.getTime() < todayStart.getTime()) {
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
    const order = await saveMutation.mutateAsync();
    const net = await NetInfo.fetch();
    const online = !!net.isConnected;

    if (online) {
      try {
        await remoteApi.createOrder(order);
        await markOrderSyncedLocal(order.id);
        Alert.alert(t("common.save"), "Order created successfully");
        router.push("/(tabs)/orders");
      } catch (e) {
        dispatch(
          enqueue({
            type: "orders/create",
            payload: order,
          })
        );
        Alert.alert(
          t("common.save"),
          "Could not reach server. Saved offline and will sync automatically."
        );
      }
    } else {
      dispatch(
        enqueue({
          type: "orders/create",
          payload: order,
        })
      );
      Alert.alert(t("common.save"), t("newOrder.savedOffline"));
    }

    setName("");
    setPhone("");
    setNotes("");
    setPrice("");
    setAdvance("");
    setGarments([]);
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
    <Screen contentClassName="p-4 gap-4 mb-[10rem] pb-[6rem]" scroll>
      <Text className="text-2xl font-bold text-black">{t("newOrder.title")}</Text>

      <Card className="gap-3">
        <SectionHeader
          title={t("newOrder.customerInfo")}
          right={
            canCopy ? (
              <Pressable
                className="px-3 py-1 rounded-full bg-blue-600"
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

      <Card className="gap-3">
        <SectionHeader
          title={t("newOrder.garments")}
          right={
            <Pressable onPress={() => setGarmentPickerOpen(true)}>
              <Text className="text-sm font-semibold text-black">
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
          <View key={g.id} className="gap-3 rounded-2xl bg-gray-50 p-3">
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
                    ? t("newOrder.sidePocketOn") ?? "Side pocket: Yes"
                    : t("newOrder.sidePocketOff") ?? "Side pocket: No"}
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

      <Card className="gap-3">
        <SectionHeader title={t("newOrder.notes")} />
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder={t("newOrder.notes")}
          multiline
        />
      </Card>

      <Card className="gap-3">
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
            minimumDate={new Date()}
            onChange={(event: DateTimePickerEvent, selected) => {
              if (Platform.OS !== "ios") setDatePickerOpen(false);
              if (event.type === "dismissed") return;
              if (selected) setDeliveryDate(selected);
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
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-700">{t("newOrder.remaining")}</Text>
          <Text className="text-base font-bold text-red-600">{remaining}</Text>
        </View>
      </Card>

      <Button title={t("common.save")} onPress={onSave} loading={saveMutation.isPending} />

      <Modal transparent visible={garmentPickerOpen} animationType="fade">
        <Pressable
          className="flex-1 bg-black/40 items-center justify-center p-6"
          onPress={() => setGarmentPickerOpen(false)}
        >
          <Pressable className="w-full rounded-2xl bg-white p-4 gap-2">
            {(["QAMEEZ", "SHALWAR", "WAISTCOAT"] as GarmentType[]).map((type) => (
              <Pressable
                key={type}
                className="h-12 rounded-xl bg-gray-100 items-center justify-center"
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

