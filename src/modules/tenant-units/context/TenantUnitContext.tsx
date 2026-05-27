import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const ACTIVE_UNIT_STORAGE_KEY = "sigess_active_unit";
const AVAILABLE_UNITS_STORAGE_KEY = "sigess_available_units";
const DEV_UNITS_STORAGE_KEY = "sigess_dev_units";

export interface TenantUnitSummary {
  id: string;
  name: string;
  code?: string | null;
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

function readStoredUnits(): { activeUnit: TenantUnitSummary | null; availableUnits: TenantUnitSummary[] } {
  if (typeof globalThis === "undefined") {
    return { activeUnit: null, availableUnits: [] };
  }

  try {
    const activeRaw = globalThis.localStorage.getItem(ACTIVE_UNIT_STORAGE_KEY);
    const availableRaw = globalThis.localStorage.getItem(AVAILABLE_UNITS_STORAGE_KEY);

    const activeUnit = activeRaw ? (JSON.parse(activeRaw) as TenantUnitSummary) : null;
    const availableUnits = availableRaw ? (JSON.parse(availableRaw) as TenantUnitSummary[]) : [];

    return { activeUnit, availableUnits };
  } catch {
    return { activeUnit: null, availableUnits: [] };
  }
}

function persistUnits(activeUnit: TenantUnitSummary | null, availableUnits: TenantUnitSummary[]) {
  if (typeof globalThis === "undefined") return;

  if (activeUnit) {
    globalThis.localStorage.setItem(ACTIVE_UNIT_STORAGE_KEY, JSON.stringify(activeUnit));
  } else {
    globalThis.localStorage.removeItem(ACTIVE_UNIT_STORAGE_KEY);
  }

  if (availableUnits.length > 0) {
    globalThis.localStorage.setItem(AVAILABLE_UNITS_STORAGE_KEY, JSON.stringify(availableUnits));
  } else {
    globalThis.localStorage.removeItem(AVAILABLE_UNITS_STORAGE_KEY);
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

export function TenantUnitProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [activeUnit, setActiveUnitState] = useState<TenantUnitSummary | null>(null);
  const [availableUnits, setAvailableUnits] = useState<TenantUnitSummary[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredUnits();
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

    const nextActiveUnit =
      devUnits.find((unit) => unit.id === activeUnit?.id) ??
      devUnits[0] ??
      null;

    setAvailableUnits(devUnits);
    setActiveUnitState(nextActiveUnit);
    persistUnits(nextActiveUnit, devUnits);
  }, [activeUnit?.id, availableUnits.length, hydrated]);

  const setActiveUnit = useCallback((unit: TenantUnitSummary | null) => {
    setActiveUnitState(unit);
    persistUnits(unit, availableUnits);
  }, [availableUnits]);

  const replaceUnits = useCallback((units: TenantUnitSummary[], activeUnitId?: string | null) => {
    const normalizedUnits = Array.isArray(units) ? units : [];
    const nextActiveUnit =
      normalizedUnits.find((unit) => unit.id === activeUnitId) ??
      normalizedUnits.find((unit) => unit.id === activeUnit?.id) ??
      normalizedUnits[0] ??
      null;

    setAvailableUnits(normalizedUnits);
    setActiveUnitState(nextActiveUnit);
    persistUnits(nextActiveUnit, normalizedUnits);
  }, [activeUnit?.id]);

  const clearUnits = useCallback(() => {
    setAvailableUnits([]);
    setActiveUnitState(null);
    persistUnits(null, []);
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
