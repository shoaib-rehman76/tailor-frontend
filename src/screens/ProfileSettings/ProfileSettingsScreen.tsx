import React from "react";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

import { Screen } from "@/src/components/common/Screen";
import { Card } from "@/src/components/common/Card";
import { SectionHeader } from "@/src/components/common/SectionHeader";
import { Input } from "@/src/components/common/Input";
import { Button } from "@/src/components/common/Button";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { clearSession } from "@/src/store/slices/authSlice";
import {
  requestSync,
  setLanguage,
  setNotifications,
  setUnit,
  updateProfile,
} from "@/src/store/slices/settingsSlice";

function ToggleChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 h-12 rounded-2xl items-center justify-center ${
        active ? "bg-slate-900" : "bg-slate-100"
      }`}
    >
      <Text className={`font-semibold ${active ? "text-white" : "text-slate-900"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ProfileSettingsScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  const pending = useAppSelector((state) => state.offlineQueue.items.length);
  const lastSyncAt = useAppSelector((state) => state.syncStatus.lastSyncAt);

  const onLogout = () => {
    dispatch(clearSession());
    router.dismissAll();
    requestAnimationFrame(() => {
      router.replace("/login");
    });
  };

  return (
    <Screen contentClassName="p-4 gap-4 bg-[#f5f7fb]" scroll>
      <LinearGradient
        colors={["#111827", "#1d4ed8", "#38bdf8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28, padding: 18 }}
      >
        <Text className="text-xs font-semibold uppercase tracking-[2px] text-white/70">
          {t("profile.heroEyebrow")}
        </Text>
        <Text className="mt-2 text-3xl font-black text-white">
          {t("profile.title")}
        </Text>
        <Text className="mt-2 text-sm leading-5 text-white/80">
          {t("profile.heroDescription")}
        </Text>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-white px-4 py-3">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {t("profile.pendingSync")}
            </Text>
            <Text className="mt-1 text-2xl font-black text-slate-950">
              {pending}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white/15 px-4 py-3">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
              {t("profile.lastSync")}
            </Text>
            <Text className="mt-1 text-sm font-bold text-white">
              {lastSyncAt
                ? new Date(lastSyncAt).toLocaleTimeString()
                : t("profile.noSyncYet")}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <Card className="gap-3 border-0 bg-white">
        <SectionHeader title={t("profile.title")} />
        <Input
          label={t("profile.tailorName")}
          value={settings.profile.tailorName}
          onChangeText={(value) => dispatch(updateProfile({ tailorName: value }))}
        />
        <Input
          label={t("profile.shopName")}
          value={settings.profile.shopName}
          onChangeText={(value) => dispatch(updateProfile({ shopName: value }))}
        />
        <Input
          label={t("profile.contact")}
          value={settings.profile.contact}
          onChangeText={(value) => dispatch(updateProfile({ contact: value }))}
          keyboardType="phone-pad"
        />
        <Input
          label={t("profile.address")}
          value={settings.profile.address}
          onChangeText={(value) => dispatch(updateProfile({ address: value }))}
          multiline
        />
      </Card>

      <Card className="gap-3 border-0 bg-white">
        <SectionHeader title={t("profile.language")} />
        <View className="flex-row gap-2">
          <ToggleChip
            active={settings.language === "en"}
            label="English"
            onPress={() => dispatch(setLanguage("en"))}
          />
          <ToggleChip
            active={settings.language === "ur"}
            label="اردو"
            onPress={() => dispatch(setLanguage("ur"))}
          />
        </View>
      </Card>

      <Card className="gap-3 border-0 bg-white">
        <SectionHeader title={t("profile.unit")} />
        <View className="flex-row gap-2">
          <ToggleChip
            active={settings.unit === "in"}
            label={t("profile.inches")}
            onPress={() => dispatch(setUnit("in"))}
          />
          <ToggleChip
            active={settings.unit === "cm"}
            label={t("profile.cm")}
            onPress={() => dispatch(setUnit("cm"))}
          />
        </View>
      </Card>

      <Card className="gap-3 border-0 bg-white">
        <SectionHeader title={t("profile.notifications")} />
        <View className="flex-row gap-2">
          <ToggleChip
            active={settings.notifications.sms}
            label={t("profile.sms")}
            onPress={() =>
              dispatch(setNotifications({ sms: !settings.notifications.sms }))
            }
          />
          <ToggleChip
            active={settings.notifications.push}
            label={t("profile.push")}
            onPress={() =>
              dispatch(setNotifications({ push: !settings.notifications.push }))
            }
          />
        </View>
      </Card>

      <Card className="gap-3 border-0 bg-white mb-[5rem]">
        <SectionHeader title={t("profile.backupSync")} />
        <View className="rounded-2xl bg-slate-50 px-4 py-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-slate-500">{t("profile.lastSync")}</Text>
            <Text className="text-sm font-semibold text-slate-950">
              {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : t("common.none")}
            </Text>
          </View>
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-sm text-slate-500">{t("profile.pendingChanges")}</Text>
            <Text className="text-sm font-semibold text-slate-950">{pending}</Text>
          </View>
        </View>
        <Button
          title={t("common.syncNow")}
          variant="secondary"
          onPress={() => {
            // Sync trigger can be wired here when a manual action is needed.
          }}
        />
        <Button
          title="Logout"
          variant="danger"
          onPress={onLogout}
        />
      </Card>
    </Screen>
  );
}
