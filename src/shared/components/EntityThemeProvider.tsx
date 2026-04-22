import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { EntitySettings } from "@/modules/settings/types/settings.types";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { generateAccessibleForeground } from "../utils/colorConversion";
import { useTheme } from "next-themes";

/**
 * CSS variables que o EntityThemeProvider gerencia diretamente das tabelas.
 */
const COLOR_MAPPINGS = {
  // corPrimaria se aplica à cor da marca de destaque e bordas ativas
  corPrimaria: ["--primary", "--ring"],
  // corSecundaria supre exclusivamente os badges secundários (bg-secondary)
  // Deixando o --accent intacto para que botões outline/ghost continuem cinza neutros.
  corSecundaria: ["--secondary"],
  // corSidebar preenche o background da navegação da esquerda
  corSidebar: ["--sidebar-background"],
} as const;

/**
 * Gera as variáveis de foreground (-foreground) que garantem a legibilidade
 * daquela cor base.
 */
const FOREGROUND_MAPPINGS = {
  corPrimaria: ["--primary-foreground"],
  corSecundaria: ["--secondary-foreground"],
  corSidebar: ["--sidebar-foreground"],
} as const;

/**
 * Aplica as cores da entidade e as cores dinamicamente geradas 
 * de texto acessível como CSS custom properties no :root.
 * Observa o cache do React Query para reagir a mudanças sem fetch extra.
 */
export function EntityThemeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { theme, resolvedTheme } = useTheme();

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  useEffect(() => {
    if (!session) {
      // Sem sessão → remove overrides, CSS volta ao default do globals.css
      const root = document.documentElement;
      for (const cssVars of Object.values(COLOR_MAPPINGS)) {
        for (const cssVar of cssVars) {
          root.style.removeProperty(cssVar);
        }
      }
      for (const cssVars of Object.values(FOREGROUND_MAPPINGS)) {
         for (const cssVar of cssVars) {
           root.style.removeProperty(cssVar);
         }
      }
      return;
    }

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.query.queryKey[0] === "settings" &&
        event.query.queryKey[1] === "entity"
      ) {
        const entity = event.query.state.data as
          | EntitySettings
          | null
          | undefined;
        applyEntityColors(entity, currentTheme);
      }
    });

    const cached = queryClient.getQueryData<EntitySettings>([
      "settings",
      "entity",
    ]);
    if (cached) {
      applyEntityColors(cached, currentTheme);
    }

    // Reaplica se o tema mudar
    if (session && cached) {
      applyEntityColors(cached, currentTheme);
    }

    return unsubscribe;
  }, [session, queryClient, currentTheme]);

  return <>{children}</>;
}

function applyEntityColors(
  entity: EntitySettings | null | undefined,
  theme: string | undefined
): void {
  if (!entity) return;

  const root = document.documentElement;

  for (const [field, cssVars] of Object.entries(COLOR_MAPPINGS)) {
    const value = entity[field as keyof typeof COLOR_MAPPINGS];
    if (value) {
      // Aplica a cor do input principal
      for (const cssVar of cssVars) {
        // Se for modo dark e a variável for a da sidebar, removemos o override
        // para que o globals.css (charcoal) assuma o controle.
        if (theme === "dark" && cssVar === "--sidebar-background") {
          root.style.removeProperty(cssVar);
          continue;
        }

        if (root.style.getPropertyValue(cssVar) !== value) {
          root.style.setProperty(cssVar, value);
        }
      }
      
      // Avalia a luminância e aplica a var de contraste para os foregrounds atrelados
      const foregroundVars = FOREGROUND_MAPPINGS[field as keyof typeof FOREGROUND_MAPPINGS];
      if (foregroundVars) {
        // Se for modo dark e estivermos tratando do foreground da sidebar, removemos o override
        if (theme === "dark" && field === "corSidebar") {
          for (const fgVar of foregroundVars) {
            root.style.removeProperty(fgVar);
          }
          continue;
        }

        const contrastColor = generateAccessibleForeground(value);
        for (const fgVar of foregroundVars) {
          if (root.style.getPropertyValue(fgVar) !== contrastColor) {
            root.style.setProperty(fgVar, contrastColor);
          }
        }
      }
    }
  }
}
