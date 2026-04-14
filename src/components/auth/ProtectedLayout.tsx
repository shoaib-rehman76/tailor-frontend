import { ActivityIndicator, View } from "react-native";
import { Redirect, Slot } from "expo-router";
import { useAppSelector } from "@/src/store/hooks";

export function ProtectedLayout({ children }: { children?: React.ReactNode }) {
  const session = useAppSelector((state) => state.auth.session);
  const hydrated = useAppSelector((state) => state.auth.hydrated);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return children ? <>{children}</> : <Slot />;
}
