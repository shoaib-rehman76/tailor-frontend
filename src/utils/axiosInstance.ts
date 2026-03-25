import axios from "axios";

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

export default axiosInstance;