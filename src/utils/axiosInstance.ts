import axios from "axios";
import { store } from "@/src/store/store";
import { clearSession } from "@/src/store/slices/authSlice";

// Prefer env-based base URL so it works on device/emulator.
// For Expo, define EXPO_PUBLIC_API_BASE_URL in a .env file at the project root.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://192.168.1.8:3000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = store.getState().auth.session?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      store.dispatch(clearSession());
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
