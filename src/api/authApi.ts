import axiosInstance from "@/src/utils/axiosInstance";
import type { AuthSession, AuthUser } from "@/src/types/auth";
import { getTokenExpiry } from "@/src/utils/jwt";

type AuthResponse = {
  token: string;
  user: AuthUser;
};

function toSession(data: AuthResponse): AuthSession {
  return {
    token: data.token,
    user: data.user,
    expiresAt: getTokenExpiry(data.token) ?? Date.now(),
  };
}

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await axiosInstance.post("/auth/login", { email, password });
    return toSession(data);
  },
  async register(name: string, email: string, password: string) {
    const { data } = await axiosInstance.post("/auth/register", {
      name,
      email,
      password,
    });
    return toSession(data);
  },
  async me() {
    const { data } = await axiosInstance.get("/auth/me");
    return data.user as AuthUser;
  },
};
