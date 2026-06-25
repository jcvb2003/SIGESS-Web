import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { EntitySettings } from "@/modules/settings/types/settings.types";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { generateAccessibleForeground } from "../utils/colorConversion";
import { useTheme } from "next-themes";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

// ---------------------------------------------------------------------------
// Contexto público
// ---------------------------------------------------------------------------

interface EntityThemeContextValue {
  /** true quando o tema da entidade foi aplicado (ou não há sessão ativa) */
  themeReady: boolean;
}

const EntityThemeContext = createContext<EntityThemeContextValue>({ themeReady: true });

export function useEntityTheme() {
  return useContext(EntityThemeContext);
}

// ---------------------------------------------------------------------------
// CSS vars gerenciadas
// ---------------------------------------------------------------------------

const COLOR_MAPPINGS = {
  corPrimaria: ["--primary", "--ring"],
  corSecundaria: ["--secondary"],
  corSidebar: ["--sidebar-background"],
} as const;

const FOREGROUND_MAPPINGS = {
  corPrimaria: ["--primary-foreground"],
  corSecundaria: ["--secondary-foreground"],
  corSidebar: ["--sidebar-foreground"],
} as const;

const DERIVED_VARS = [
  "--field-filled-bg",
  "--field-filled-border",
  "--field-filled-border-focus",
];

function clearAllManagedVars(root: HTMLElement) {
  for (const cssVars of Object.values(COLOR_MAPPINGS)) {
    for (const cssVar of cssVars) root.style.removeProperty(cssVar);
  }
  for (const cssVars of Object.values(FOREGROUND_MAPPINGS)) {
    for (const cssVar of cssVars) root.style.removeProperty(cssVar);
  }
  for (const cssVar of DERIVED_VARS) root.style.removeProperty(cssVar);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function EntityThemeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { unitId } = useActiveScope();
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;

  // Contador usado apenas para forçar re-renders quando o cache muda.
  // themeReady é computado sincronamente a cada render — sem lag de useState.
  const [cacheVersion, setCacheVersion] = useState(0);

  // themeReady calculado de forma síncrona:
  // - Sem sessão: true (tela de login, nenhum tema customizado necessário)
  // - Com sessão: true apenas quando dados da entidade estão no cache
  const entityCachedData = queryClient.getQueryData<EntitySettings>([
    "settings",
    "entity",
    unitId,
  ]);
  const entityCached = entityCachedData != null;
  const themeReady = !session || entityCached;

  // Aplica as CSS vars ANTES do paint (useLayoutEffect).
  // Dependência de cacheVersion garante re-execução quando dados chegam.
  useLayoutEffect(() => {
    if (!session) {
      clearAllManagedVars(document.documentElement);
      return;
    }
    applyEntityColors(entityCachedData, currentTheme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, currentTheme, cacheVersion, unitId]);

  // Subscription: dispara re-render quando o cache da entidade muda.
  // O re-render recalcula entityCached/themeReady de forma síncrona.
  useEffect(() => {
    if (!session) return;

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.query.queryKey[0] === "settings" &&
        event.query.queryKey[1] === "entity"
      ) {
        setCacheVersion((v) => v + 1);
      }
    });

    return unsubscribe;
  }, [session, queryClient]);

  // Fallback de segurança: se a query demorar ou falhar, desbloqueio após 3s.
  useEffect(() => {
    if (themeReady) return;
    const timer = setTimeout(() => setCacheVersion((v) => v + 1), 3000);
    return () => clearTimeout(timer);
  }, [themeReady]);

  return (
    <EntityThemeContext.Provider value={{ themeReady }}>
      {children}
    </EntityThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Aplicação de cores
// ---------------------------------------------------------------------------

function applyEntityColors(
  entity: EntitySettings | null | undefined,
  theme: string | undefined,
): void {
  const root = document.documentElement;
  clearAllManagedVars(root);
  if (!entity) return;

  for (const [field, cssVars] of Object.entries(COLOR_MAPPINGS)) {
    const value = entity[field as keyof typeof COLOR_MAPPINGS];
    if (!value) continue;

    for (const cssVar of cssVars) {
      if (theme === "dark" && cssVar === "--sidebar-background") continue;
      root.style.setProperty(cssVar, value);
    }

    const foregroundVars = FOREGROUND_MAPPINGS[field as keyof typeof FOREGROUND_MAPPINGS];
    if (foregroundVars) {
      if (theme === "dark" && field === "corSidebar") continue;
      const contrastColor = generateAccessibleForeground(value);
      for (const fgVar of foregroundVars) {
        root.style.setProperty(fgVar, contrastColor);
      }
    }

    if (field === "corPrimaria") {
      const [hue] = value.trim().split(/\s+/);
      if (theme === "dark") {
        root.style.setProperty("--field-filled-bg",          `${hue} 40% 18%`);
        root.style.setProperty("--field-filled-border",       `${hue} 40% 32%`);
        root.style.setProperty("--field-filled-border-focus", `${hue} 50% 45%`);
      } else {
        root.style.setProperty("--field-filled-bg",          `${hue} 81% 96%`);
        root.style.setProperty("--field-filled-border",       `${hue} 55% 82%`);
        root.style.setProperty("--field-filled-border-focus", `${hue} 55% 68%`);
      }
    }
  }
}
