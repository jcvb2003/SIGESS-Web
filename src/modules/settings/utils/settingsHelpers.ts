export const toStringValue = (value: unknown, fallback = ""): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};

export const toNullable = (value: string | undefined | null): string | null => {
  const trimmed = value?.trim();
  return trimmed || null;
};

export const toOptional = (value: string | undefined | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};

export const normalizeUf = (value: unknown): string => {
  const normalized = toStringValue(value)
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .replaceAll(/[^a-zA-Z]/g, "")
    .trim()
    .toUpperCase();
  return normalized.slice(0, 2);
};
