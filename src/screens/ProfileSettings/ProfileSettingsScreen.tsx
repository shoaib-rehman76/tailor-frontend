import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "@/src/components/common/Screen";
import { Card } from "@/src/components/common/Card";
import { SectionHeader } from "@/src/components/common/SectionHeader";
import { Input } from "@/src/components/common/Input";
import { Button } from "@/src/components/common/Button";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  setLanguage,
  setNotifications,
  setUnit,
  updateProfile,
} from "@/src/store/slices/settingsSlice";

export function ProfileSettingsScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((s) => s.settings);
  const pending = useAppSelector((s) => s.offlineQueue.items.length);
  const lastSyncAt = useAppSelector((s) => s.syncStatus.lastSyncAt);

  return (
    <Screen contentClassName="p-4 gap-4" scroll>
      <Text className="text-2xl font-bold text-black">{t("profile.title")}</Text>

      <Card className="gap-3">
        <SectionHeader title={t("profile.title")} />
        <Input
          label={t("profile.tailorName")}
          value={settings.profile.tailorName}
          onChangeText={(v) => dispatch(updateProfile({ tailorName: v }))}
        />
        <Input
          label={t("profile.shopName")}
          value={settings.profile.shopName}
          onChangeText={(v) => dispatch(updateProfile({ shopName: v }))}
        />
        <Input
          label={t("profile.contact")}
          value={settings.profile.contact}
          onChangeText={(v) => dispatch(updateProfile({ contact: v }))}
          keyboardType="phone-pad"
        />
        <Input
          label={t("profile.address")}
          value={settings.profile.address}
          onChangeText={(v) => dispatch(updateProfile({ address: v }))}
          multiline
        />
      </Card>

      <Card className="gap-3">
        <SectionHeader title={t("profile.language")} />
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => dispatch(setLanguage("en"))}
            className={`flex-1 h-12 rounded-xl items-center justify-center ${
              settings.language === "en" ? "bg-black" : "bg-gray-100"
            }`}
          >
            <Text
              className={`font-semibold ${
                settings.language === "en" ? "text-white" : "text-black"
              }`}
            >
              English
            </Text>
          </Pressable>
          <Pressable
            onPress={() => dispatch(setLanguage("ur"))}
            className={`flex-1 h-12 rounded-xl items-center justify-center ${
              settings.language === "ur" ? "bg-black" : "bg-gray-100"
            }`}
          >
            <Text
              className={`font-semibold ${
                settings.language === "ur" ? "text-white" : "text-black"
              }`}
            >
              اردو
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card className="gap-3">
        <SectionHeader title={t("profile.unit")} />
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => dispatch(setUnit("in"))}
            className={`flex-1 h-12 rounded-xl items-center justify-center ${
              settings.unit === "in" ? "bg-black" : "bg-gray-100"
            }`}
          >
            <Text
              className={`font-semibold ${
                settings.unit === "in" ? "text-white" : "text-black"
              }`}
            >
              {t("profile.inches")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => dispatch(setUnit("cm"))}
            className={`flex-1 h-12 rounded-xl items-center justify-center ${
              settings.unit === "cm" ? "bg-black" : "bg-gray-100"
            }`}
          >
            <Text
              className={`font-semibold ${
                settings.unit === "cm" ? "text-white" : "text-black"
              }`}
            >
              {t("profile.cm")}
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card className="gap-3">
        <SectionHeader title={t("profile.notifications")} />
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => dispatch(setNotifications({ sms: !settings.notifications.sms }))}
            className={`flex-1 h-12 rounded-xl items-center justify-center ${
              settings.notifications.sms ? "bg-black" : "bg-gray-100"
            }`}
          >
            <Text
              className={`font-semibold ${
                settings.notifications.sms ? "text-white" : "text-black"
              }`}
            >
              {t("profile.sms")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => dispatch(setNotifications({ push: !settings.notifications.push }))}
            className={`flex-1 h-12 rounded-xl items-center justify-center ${
              settings.notifications.push ? "bg-black" : "bg-gray-100"
            }`}
          >
            <Text
              className={`font-semibold ${
                settings.notifications.push ? "text-white" : "text-black"
              }`}
            >
              {t("profile.push")}
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card className="gap-3">
        <SectionHeader title={t("profile.backupSync")} />
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">{t("profile.lastSync")}</Text>
          <Text className="text-sm font-semibold text-black">
            {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "—"}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">{t("profile.pendingChanges")}</Text>
          <Text className="text-sm font-semibold text-black">{pending}</Text>
        </View>
        <Button
          title={t("common.syncNow")}
          variant="secondary"
          onPress={() => {
            // Offline sync is wired next; button is ready.
          }}
        />
      </Card>
    </Screen>
  );
}

