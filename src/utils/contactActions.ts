import { isAvailableAsync, sendSMSAsync } from "expo-sms";
import { Linking } from "react-native";

function normalizePhone(phone: string) {
  const trimmed = phone.replace(/\s+/g, "");

  if (/^03\d{9}$/.test(trimmed)) {
    return `92${trimmed.slice(1)}`;
  }

  if (/^\+92\d{10}$/.test(trimmed)) {
    return trimmed.slice(1);
  }

  return trimmed.replace(/[^\d]/g, "");
}

export async function sendSms(phone: string, message: string) {
  const available = await isAvailableAsync();
  if (!available) return false;

  await sendSMSAsync([phone.replace(/\s+/g, "")], message);

  return true;
}

export async function openWhatsApp(phone: string, message: string) {
  const normalized = normalizePhone(phone);
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
}

export async function callPhone(phone: string) {
  const url = `tel:${phone.replace(/\s+/g, "")}`;
  await Linking.openURL(url);
}
