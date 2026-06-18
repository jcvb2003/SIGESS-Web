import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { EntitySettings } from "@/modules/settings/types/settings.types";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { generateAccessibleForeground } from "../utils/colorConversion";
import { useTheme } from "next-themes";

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

export function EntityThemeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { theme, resolvedTheme } = useTheme();

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  // useLayoutEffect para aplicar cores antes do primeiro paint e evitar flash
  useLayoutEffect(() => {
    if (!session) {
      clearAllManagedVars(document.documentElement);
      return;
    }

    const cached = queryClient.getQueryData<EntitySettings>(["settings", "entity"]);
    if (cached) {
      applyEntityColors(cached, currentTheme);
    }
  }, [session, queryClient, currentTheme]);

  // useEffect para subscrever mudanças futuras (save, reset)
  useEffect(() => {
    if (!session) return;

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.query.queryKey[0] === "settings" &&
        event.query.queryKey[1] === "entity"
      ) {
        const entity = event.query.state.data as EntitySettings | null | undefined;
        applyEntityColors(entity, currentTheme);
      }
    });

    return unsubscribe;
  }, [session, queryClient, currentTheme]);

  return <>{children}</>;
}

function applyEntityColors(
  entity: EntitySettings | null | undefined,
  theme: string | undefined
): void {
  const root = document.documentElement;

  // Limpa todos os overrides antes de reaplicar — garante que um reset
  // para o padrão não deixe vars obsoletas do estado anterior.
  clearAllManagedVars(root);

  if (!entity) return;

  for (const [field, cssVars] of Object.entries(COLOR_MAPPINGS)) {
    const value = entity[field as keyof typeof COLOR_MAPPINGS];
    if (!value) continue;

    for (const cssVar of cssVars) {
      if (theme === "dark" && cssVar === "--sidebar-background") {
        continue; // dark mode usa charcoal do globals.css
      }
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
