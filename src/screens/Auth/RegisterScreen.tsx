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

export function RegisterScreen() {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const mutation = useMutation({
    mutationFn: () => authApi.register(name.trim(), email.trim(), password),
    onSuccess: (session) => {
      dispatch(setSession(session));
      router.replace("/orders");
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? "Registration failed");
    },
  });

  const onSubmit = () => {
    const nextErrors: typeof fieldErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      nextErrors.name = "Name is required";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required";
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = "Enter a valid email";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
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
      eyebrow="Create tailor account"
      title="Set up your workspace"
      subtitle="Create the tailor account once, then use it to unlock the app on every launch."
    >
      <Card className="gap-4 border-0 bg-white">
        <Input
          label="Name"
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (error) setError("");
            if (fieldErrors.name) {
              setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }
          }}
          placeholder="Your name"
          error={fieldErrors.name}
        />
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
          placeholder="Minimum 6 characters"
          secureTextEntry
          autoCapitalize="none"
          error={fieldErrors.password}
        />
        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
        <Button
          title="Create account"
          onPress={onSubmit}
          loading={mutation.isPending}
        />
        <Pressable onPress={() => router.replace("/login")}>
          <Text className="text-center text-sm text-slate-600">
            Already registered? <Text className="font-semibold text-slate-950">Login</Text>
          </Text>
        </Pressable>
      </Card>
    </AuthScreen>
  );
}
