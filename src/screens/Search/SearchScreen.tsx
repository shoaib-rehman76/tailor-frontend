import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";

import { Screen } from "@/src/components/common/Screen";
import { Card } from "@/src/components/common/Card";
import { Input } from "@/src/components/common/Input";
import { SectionHeader } from "@/src/components/common/SectionHeader";
import { searchOrdersLocal } from "@/src/api/ordersRepository";

export function SearchScreen() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");

  const query = useQuery({
    queryKey: ["orders", "search", q],
    queryFn: () => searchOrdersLocal(q),
  });

  const results = useMemo(() => query.data ?? [], [query.data]);

  const customers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; phone: string; orderCount: number; totalPaid: number }
    >();
    for (const o of results) {
      const phone = o.customer.phone;
      const existing = map.get(phone) ?? {
        name: o.customer.name,
        phone,
        orderCount: 0,
        totalPaid: 0,
      };
      existing.orderCount += 1;
      const paid = (o.payments ?? []).reduce((sum, p) => sum + (p.amount || 0), 0);
      existing.totalPaid += paid;
      map.set(phone, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.orderCount - a.orderCount);
  }, [results]);

  return (
    <Screen contentClassName="p-4 gap-4" scroll>
      <SectionHeader title={t("search.title")} />
      <Input
        value={q}
        onChangeText={setQ}
        placeholder={t("search.placeholder")}
      />
      <Card>
        <Text className="text-sm text-gray-600">{t("search.filters")}</Text>
        <Text className="text-xs text-gray-500 mt-1">
          (Filters placeholder: date range, payment status, garment type)
        </Text>
      </Card>

      {customers.map((c) => (
        <Pressable
          key={c.phone}
          onPress={() => router.push(`/customer/${c.phone.replace(/\s+/g, "")}`)}
        >
          <Card className="gap-2">
            <Text className="text-base font-semibold text-black">
              {c.name}
            </Text>
            <Text className="text-sm text-gray-600">{c.phone}</Text>
            <View className="flex-row justify-between mt-1">
              <Text className="text-xs text-gray-700">
                {t("customerHistory.orderCount")}: {c.orderCount}
              </Text>
              <Text className="text-xs text-gray-700">
                {t("customerHistory.totalSpent")}: {c.totalPaid}
              </Text>
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

