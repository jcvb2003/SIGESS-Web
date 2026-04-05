import { useWatch } from "react-hook-form";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { EntityFormData } from "./useEntityValidation";
import type { EntitySettings } from "@/modules/settings/types/settings.types";
import { generateAccessibleForeground } from "@/shared/utils/colorConversion";

/**
 * Aplica preview ao vivo das cores no documento enquanto o usuário edita.
 * As variáveis CSS são setadas no onChange → a interface reflete instantaneamente.
 * Ao desmontar, restaura os valores que estavam antes.
 */
export function useColorPreview() {
  const corPrimaria = useWatch<EntityFormData>({
    name: "corPrimaria",
  }) as string | undefined;
  const corSecundaria = useWatch<EntityFormData>({
    name: "corSecundaria",
  }) as string | undefined;
  const corSidebar = useWatch<EntityFormData>({
    name: "corSidebar",
  }) as string | undefined;

  const originalRef = useRef<Record<string, string>>({});
  const queryClient = useQueryClient();

  // Salva os valores originais ao montar (como fallback, se não tiver cache)
  useEffect(() => {
    const root = document.documentElement;
    originalRef.current = {
      "--primary": root.style.getPropertyValue("--primary"),
      "--ring": root.style.getPropertyValue("--ring"),
      "--primary-foreground": root.style.getPropertyValue("--primary-foreground"),
      "--secondary": root.style.getPropertyValue("--secondary"),
      "--secondary-foreground": root.style.getPropertyValue("--secondary-foreground"),
      "--sidebar-background": root.style.getPropertyValue("--sidebar-background"),
      "--sidebar-foreground": root.style.getPropertyValue("--sidebar-foreground"),
    };

    return () => {
      // Ao desmontar (usuário saiu da aba), garantimos que o :root reflita
      // o estado REAL do banco de dados (que está no cache).
      // Isso conserta o bug onde a cor antiga era restaurada caso o usuário salvasse e saísse.
      const cached = queryClient.getQueryData<EntitySettings>(["settings", "entity"]);
      
      const corPrimariaCache = cached?.corPrimaria || originalRef.current["--primary"];
      const corSecundariaCache = cached?.corSecundaria || originalRef.current["--secondary"];
      const corSidebarCache = cached?.corSidebar || originalRef.current["--sidebar-background"];

      const root = document.documentElement;
      
      if (corPrimariaCache) {
        root.style.setProperty("--primary", corPrimariaCache);
        root.style.setProperty("--ring", corPrimariaCache);
        root.style.setProperty("--primary-foreground", generateAccessibleForeground(corPrimariaCache));
      } else {
        root.style.removeProperty("--primary");
        root.style.removeProperty("--ring");
        root.style.removeProperty("--primary-foreground");
      }

      if (corSecundariaCache) {
        root.style.setProperty("--secondary", corSecundariaCache);
        root.style.setProperty("--secondary-foreground", generateAccessibleForeground(corSecundariaCache));
      } else {
        root.style.removeProperty("--secondary");
        root.style.removeProperty("--secondary-foreground");
      }

      if (corSidebarCache) {
        root.style.setProperty("--sidebar-background", corSidebarCache);
        root.style.setProperty("--sidebar-foreground", generateAccessibleForeground(corSidebarCache));
      } else {
        root.style.removeProperty("--sidebar-background");
        root.style.removeProperty("--sidebar-foreground");
      }
    };
  }, [queryClient]);

  // Aplica preview em tempo real
  useEffect(() => {
    const root = document.documentElement;
    if (corPrimaria) {
      root.style.setProperty("--primary", corPrimaria);
      root.style.setProperty("--ring", corPrimaria);
      root.style.setProperty("--primary-foreground", generateAccessibleForeground(corPrimaria));
    }
  }, [corPrimaria]);

  useEffect(() => {
    const root = document.documentElement;
    if (corSecundaria) {
      root.style.setProperty("--secondary", corSecundaria);
      root.style.setProperty("--secondary-foreground", generateAccessibleForeground(corSecundaria));
    }
  }, [corSecundaria]);

  useEffect(() => {
    const root = document.documentElement;
    if (corSidebar) {
      root.style.setProperty("--sidebar-background", corSidebar);
      root.style.setProperty("--sidebar-foreground", generateAccessibleForeground(corSidebar));
    }
  }, [corSidebar]);
}
