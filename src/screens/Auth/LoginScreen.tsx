import React, { useState } from "react";
import { Pressable, Text } from "react-native";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useAppDispatch } from "@/src/store/hooks";
import { setSession } from "@/src/store/slices/authSlice";
import { authApi } from "@/src/api/authApi";
import { AuthScreen } from "@/src/components/auth/AuthScreen";
import { Card } from "@/src/components/common/Card";
import { Input } from "@/src/components/common/Input";
import { Button } from "@/src/components/common/Button";
import { isValidEmail } from "@/src/utils/validation";

export function LoginScreen() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const mutation = useMutation({
    mutationFn: () => authApi.login(email.trim(), password),
    onSuccess: (session) => {
      dispatch(setSession(session));
      router.replace("/orders");
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? "Login failed");
    },
  });

  const onSubmit = () => {
    const nextErrors: typeof fieldErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextErrors.email = "Email is required";
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = "Enter a valid email";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("");
      return;
    }

    setFieldErrors({});
    mutation.mutate();
  };

  return (
    <AuthScreen
      eyebrow="Tailor access"
      title="Welcome back"
      subtitle="Login before accessing orders, dashboard, and customer records."
    >
      <Card className="gap-4 border-0 bg-white">
        <Input
          label="Email"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (error) setError("");
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }
          }}
          placeholder="tailor@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={fieldErrors.email}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (error) setError("");
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          placeholder="Enter password"
          secureTextEntry
          autoCapitalize="none"
          error={fieldErrors.password}
        />
        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
        <Button
          title="Login"
          onPress={onSubmit}
          loading={mutation.isPending}
        />
        <Pressable onPress={() => router.push("/register")}>
          <Text className="text-center text-sm text-slate-600">
            No account yet? <Text className="font-semibold text-slate-950">Create one</Text>
          </Text>
        </Pressable>
      </Card>
    </AuthScreen>
  );
}
