export function isValidPhone(phoneRaw: string) {
  const phone = phoneRaw.replace(/\s+/g, "");
  // Simple Pakistan-focused default: 11 digits starting 03 or +92...
  if (/^03\d{9}$/.test(phone)) return true;
  if (/^\+92\d{10}$/.test(phone)) return true;
  return phone.length >= 7;
}

export function isValidEmail(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
