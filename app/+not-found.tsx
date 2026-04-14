import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAppSelector } from "@/src/store/hooks";

export default function NotFoundScreen() {
  const session = useAppSelector((state) => state.auth.session);

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-black text-slate-950">Route not found</Text>
      <Text className="mt-2 text-center text-sm text-slate-500">
        We could not find that page. Use the button below to return safely.
      </Text>
      <Pressable
        className="mt-6 rounded-2xl bg-slate-900 px-5 py-3"
        onPress={() => router.replace(session ? "/orders" : "/login")}
      >
        <Text className="font-semibold text-white">Go back</Text>
      </Pressable>
    </View>
  );
}
