import { AppProviders } from "@/src/AppProviders";
import { Stack } from "expo-router";
import "../src/styles/global.css";

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
