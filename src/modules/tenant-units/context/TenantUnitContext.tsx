import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const ACTIVE_UNIT_STORAGE_KEY = "sigess_active_unit";
const AVAILABLE_UNITS_STORAGE_KEY = "sigess_available_units";
const DEV_UNITS_STORAGE_KEY = "sigess_dev_units";
const TENANT_CONFIG_CACHE_KEY = "sigess_tenant_config";

export interface TenantUnitSummary {
  id: string;
  name: string;
  code?: string | null;
  tenantId?: string | null;
}

interface TenantUnitContextValue {
  activeUnit: TenantUnitSummary | null;
  availableUnits: TenantUnitSummary[];
  hasMultipleUnits: boolean;
  hydrated: boolean;
  setActiveUnit: (unit: TenantUnitSummary | null) => void;
  replaceUnits: (units: TenantUnitSummary[], activeUnitId?: string | null) => void;
  clearUnits: () => void;
}

const TenantUnitContext = createContext<TenantUnitContextValue | undefined>(undefined);

// ─── Tenant-scoped storage helpers ──────────────────────────────────────────

function getTenantCode(): string | null {
  try {
    const raw = globalThis.localStorage?.getItem(TENANT_CONFIG_CACHE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { code?: string }).code ?? null;
  } catch {
    return null;
  }
}

function scopedKey(base: string, tenantCode: string | null): string {
  return tenantCode ? `${base}_${tenantCode}` : base;
}

function readStoredUnits(tenantCode: string | null): {
  activeUnit: TenantUnitSummary | null;
  availableUnits: TenantUnitSummary[];
} {
  if (typeof globalThis === "undefined") {
    return { activeUnit: null, availableUnits: [] };
  }

  try {
    const activeKey = scopedKey(ACTIVE_UNIT_STORAGE_KEY, tenantCode);
    const availableKey = scopedKey(AVAILABLE_UNITS_STORAGE_KEY, tenantCode);

    let activeRaw = globalThis.localStorage.getItem(activeKey);
    let availableRaw = globalThis.localStorage.getItem(availableKey);

    // One-time migration from legacy global keys → scoped keys.
    // Runs only when scoped key is absent, moves data and removes legacy key.
    if (tenantCode && !activeRaw) {
      const legacy = globalThis.localStorage.getItem(ACTIVE_UNIT_STORAGE_KEY);
      if (legacy) {
        globalThis.localStorage.setItem(activeKey, legacy);
        globalThis.localStorage.removeItem(ACTIVE_UNIT_STORAGE_KEY);
        activeRaw = legacy;
      }
    }
    if (tenantCode && !availableRaw) {
      const legacy = globalThis.localStorage.getItem(AVAILABLE_UNITS_STORAGE_KEY);
      if (legacy) {
        globalThis.localStorage.setItem(availableKey, legacy);
        globalThis.localStorage.removeItem(AVAILABLE_UNITS_STORAGE_KEY);
        availableRaw = legacy;
      }
    }

    const activeUnit = activeRaw ? (JSON.parse(activeRaw) as TenantUnitSummary) : null;
    const availableUnits = availableRaw ? (JSON.parse(availableRaw) as TenantUnitSummary[]) : [];

    return { activeUnit, availableUnits };
  } catch {
    return { activeUnit: null, availableUnits: [] };
  }
}

function persistUnits(
  activeUnit: TenantUnitSummary | null,
  availableUnits: TenantUnitSummary[],
  tenantCode: string | null,
) {
  if (typeof globalThis === "undefined") return;

  const activeKey = scopedKey(ACTIVE_UNIT_STORAGE_KEY, tenantCode);
  const availableKey = scopedKey(AVAILABLE_UNITS_STORAGE_KEY, tenantCode);

  if (activeUnit) {
    globalThis.localStorage.setItem(activeKey, JSON.stringify(activeUnit));
  } else {
    globalThis.localStorage.removeItem(activeKey);
  }

  if (availableUnits.length > 0) {
    globalThis.localStorage.setItem(availableKey, JSON.stringify(availableUnits));
  } else {
    globalThis.localStorage.removeItem(availableKey);
  }
}

function readDevUnits(): TenantUnitSummary[] {
  if (typeof globalThis === "undefined" || !import.meta.env.DEV) {
    return [];
  }

  try {
    const raw = globalThis.localStorage.getItem(DEV_UNITS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TenantUnitSummary[]) : [];
  } catch {
    return [];
  }
}

function resolveNextActiveUnit(
  units: TenantUnitSummary[],
  preferredActiveUnitId?: string | null,
  currentActiveUnitId?: string | null,
) {
  const normalizedUnits = Array.isArray(units) ? units : [];

  const currentUnit =
    normalizedUnits.find((unit) => unit.id === currentActiveUnitId) ?? null;
  if (currentUnit) {
    return currentUnit;
  }

  if (normalizedUnits.length === 1) {
    return normalizedUnits[0] ?? null;
  }

  const preferredUnit =
    normalizedUnits.find((unit) => unit.id === preferredActiveUnitId) ?? null;
  if (preferredUnit) {
    return preferredUnit;
  }

  return null;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function TenantUnitProvider({ children }: Readonly<{ children: ReactNode }>) {
  const tenantCodeRef = useRef<string | null>(getTenantCode());

  const [activeUnit, setActiveUnitState] = useState<TenantUnitSummary | null>(null);
  const [availableUnits, setAvailableUnits] = useState<TenantUnitSummary[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const activeUnitRef = useRef<TenantUnitSummary | null>(null);
  const availableUnitsRef = useRef<TenantUnitSummary[]>([]);

  useEffect(() => {
    activeUnitRef.current = activeUnit;
  }, [activeUnit]);

  useEffect(() => {
    availableUnitsRef.current = availableUnits;
  }, [availableUnits]);

  useEffect(() => {
    const stored = readStoredUnits(tenantCodeRef.current);
    setActiveUnitState(stored.activeUnit);
    setAvailableUnits(stored.availableUnits);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || availableUnits.length > 0) {
      return;
    }

    const devUnits = readDevUnits();
    if (devUnits.length === 0) {
      return;
    }

    const nextActiveUnit = resolveNextActiveUnit(
      devUnits,
      null,
      activeUnit?.id ?? null,
    );

    setAvailableUnits(devUnits);
    setActiveUnitState(nextActiveUnit);
    persistUnits(nextActiveUnit, devUnits, tenantCodeRef.current);
  }, [activeUnit?.id, availableUnits.length, hydrated]);

  const setActiveUnit = useCallback((unit: TenantUnitSummary | null) => {
    setActiveUnitState(unit);
    activeUnitRef.current = unit;
    persistUnits(unit, availableUnitsRef.current, tenantCodeRef.current);
  }, []);

  const replaceUnits = useCallback((units: TenantUnitSummary[], activeUnitId?: string | null) => {
    const normalizedUnits = Array.isArray(units) ? units : [];
    const nextActiveUnit = resolveNextActiveUnit(
      normalizedUnits,
      activeUnitId,
      activeUnitRef.current?.id ?? null,
    );

    availableUnitsRef.current = normalizedUnits;
    activeUnitRef.current = nextActiveUnit;
    setAvailableUnits(normalizedUnits);
    setActiveUnitState(nextActiveUnit);
    persistUnits(nextActiveUnit, normalizedUnits, tenantCodeRef.current);
  }, []);

  const clearUnits = useCallback(() => {
    availableUnitsRef.current = [];
    activeUnitRef.current = null;
    setAvailableUnits([]);
    setActiveUnitState(null);
    persistUnits(null, [], tenantCodeRef.current);
  }, []);

  const value = useMemo<TenantUnitContextValue>(() => ({
    activeUnit,
    availableUnits,
    hasMultipleUnits: availableUnits.length > 1,
    hydrated,
    setActiveUnit,
    replaceUnits,
    clearUnits,
  }), [activeUnit, availableUnits, hydrated, setActiveUnit, replaceUnits, clearUnits]);

  return (
    <TenantUnitContext.Provider value={value}>
      {children}
    </TenantUnitContext.Provider>
  );
}

export function useTenantUnits() {
  const context = useContext(TenantUnitContext);
  if (!context) {
    throw new Error("useTenantUnits must be used within a TenantUnitProvider");
  }
  return context;
}
