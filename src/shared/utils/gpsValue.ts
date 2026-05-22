const GPS_VALOR_STORAGE_KEY = "sigess:web:gps-valor";

export function formatGpsCurrencyInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "");
  if (!digits) return "";

  const amount = Number.parseInt(digits, 10) / 100;
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function normalizeGpsCurrencyValue(value?: string): string {
  return String(value || "").trim();
}

export function hasGpsCurrencyValue(value?: string): boolean {
  return normalizeGpsCurrencyValue(value).length > 0;
}

export function getStoredGpsCurrencyValue(): string {
  try {
    return normalizeGpsCurrencyValue(globalThis.localStorage.getItem(GPS_VALOR_STORAGE_KEY) || "");
  } catch {
    return "";
  }
}

export function setStoredGpsCurrencyValue(value: string): void {
  const normalized = normalizeGpsCurrencyValue(value);

  try {
    if (!normalized) {
      globalThis.localStorage.removeItem(GPS_VALOR_STORAGE_KEY);
      return;
    }

    globalThis.localStorage.setItem(GPS_VALOR_STORAGE_KEY, normalized);
  } catch {
    // Ignora falhas de persistencia local.
  }
}
