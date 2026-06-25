import { useWatch } from "react-hook-form";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import type { EntityFormData } from "./useEntityValidation";
import type { EntitySettings } from "@/modules/settings/types/settings.types";
import { generateAccessibleForeground } from "@/shared/utils/colorConversion";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

/**
 * Aplica preview ao vivo das cores no documento enquanto o usuário edita.
 * Ao desmontar, restaura o estado salvo do cache (não o estado capturado no mount,
 * que pode estar vazio se a entidade ainda não tinha carregado).
 */
export function useColorPreview() {
  const corPrimaria = useWatch<EntityFormData>({ name: "corPrimaria" }) as string | undefined;
  const corSecundaria = useWatch<EntityFormData>({ name: "corSecundaria" }) as string | undefined;
  const corSidebar = useWatch<EntityFormData>({ name: "corSidebar" }) as string | undefined;

  const queryClient = useQueryClient();
  const { unitId } = useActiveScope();
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;

  // Ref para garantir que o cleanup sempre leia o tema atual,
  // sem capturar um valor stale do momento em que o effect foi criado.
  const currentThemeRef = useRef(currentTheme);
  useEffect(() => { currentThemeRef.current = currentTheme; });

  // Restaura ao desmontar (navegação entre abas de Settings)
  useEffect(() => {
    return () => {
      const cached = queryClient.getQueryData<EntitySettings>([
        "settings",
        "entity",
        unitId,
      ]);

      const root = document.documentElement;
      const theme = currentThemeRef.current;

      if (cached?.corPrimaria) {
        root.style.setProperty("--primary", cached.corPrimaria);
        root.style.setProperty("--ring", cached.corPrimaria);
        root.style.setProperty("--primary-foreground", generateAccessibleForeground(cached.corPrimaria));
      } else {
        root.style.removeProperty("--primary");
        root.style.removeProperty("--ring");
        root.style.removeProperty("--primary-foreground");
      }

      if (cached?.corSecundaria) {
        root.style.setProperty("--secondary", cached.corSecundaria);
        root.style.setProperty("--secondary-foreground", generateAccessibleForeground(cached.corSecundaria));
      } else {
        root.style.removeProperty("--secondary");
        root.style.removeProperty("--secondary-foreground");
      }

      if (theme === "dark") {
        root.style.removeProperty("--sidebar-background");
        root.style.removeProperty("--sidebar-foreground");
      } else if (cached?.corSidebar) {
        root.style.setProperty("--sidebar-background", cached.corSidebar);
        root.style.setProperty("--sidebar-foreground", generateAccessibleForeground(cached.corSidebar));
      } else {
        root.style.removeProperty("--sidebar-background");
        root.style.removeProperty("--sidebar-foreground");
      }
    };
  }, [queryClient, unitId]); // currentTheme removido das deps — usa ref para evitar closure stale

  // Preview em tempo real — primary
  useEffect(() => {
    const root = document.documentElement;
    if (corPrimaria) {
      root.style.setProperty("--primary", corPrimaria);
      root.style.setProperty("--ring", corPrimaria);
      root.style.setProperty("--primary-foreground", generateAccessibleForeground(corPrimaria));
    }
  }, [corPrimaria]);

  // Preview em tempo real — secondary
  useEffect(() => {
    const root = document.documentElement;
    if (corSecundaria) {
      root.style.setProperty("--secondary", corSecundaria);
      root.style.setProperty("--secondary-foreground", generateAccessibleForeground(corSecundaria));
    }
  }, [corSecundaria]);

  // Preview em tempo real — sidebar
  useEffect(() => {
    const root = document.documentElement;
    if (currentTheme === "dark") {
      root.style.removeProperty("--sidebar-background");
      root.style.removeProperty("--sidebar-foreground");
      return;
    }
    if (corSidebar) {
      root.style.setProperty("--sidebar-background", corSidebar);
      root.style.setProperty("--sidebar-foreground", generateAccessibleForeground(corSidebar));
    }
  }, [corSidebar, currentTheme]);
}
