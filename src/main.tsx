import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { AppProviders } from "./app/providers/AppProviders";
import { AppRouter } from "./app/router";
import "./app/styles/globals.css";

const SW_RELOAD_KEY = "sigess_sw_reloading";
const SW_BUILD_KEY = "sigess_sw_build";
const BUILD_MARKER = import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA ?? globalThis.location.pathname;

if ("serviceWorker" in navigator) {
  let hasRegisteredReload = false;

  const safeReload = () => {
    if (sessionStorage.getItem(SW_RELOAD_KEY) === BUILD_MARKER) return;

    // Não recarregar se o usuário já preencheu qualquer campo de formulário.
    const hasFormData = Array.from(
      document.querySelectorAll<HTMLInputElement>("input, textarea, select"),
    ).some((el) => el.value.length > 0);
    if (hasFormData) return;

    sessionStorage.setItem(SW_RELOAD_KEY, BUILD_MARKER);
    globalThis.location.reload();
  };

  // Não usar controllerchange: dispara na primeira ativação normal do SW,
  // causando reloads inesperados mesmo sem nova versão disponível.
  // onNeedRefresh é o hook correto — só dispara quando há atualização real.
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration || hasRegisteredReload) return;
      hasRegisteredReload = true;

      const lastSeenBuild = localStorage.getItem(SW_BUILD_KEY);
      if (lastSeenBuild !== BUILD_MARKER) {
        localStorage.setItem(SW_BUILD_KEY, BUILD_MARKER);
        registration.update().catch(() => {});
      }
    },
    onNeedRefresh() {
      safeReload();
    },
  });
}

// --- DOM protection patch ---
// Browser extensions (Google Translate, Grammarly, password managers, etc.)
// can modify DOM nodes that React manages. When React later tries to remove
// or insert those nodes, it throws "Failed to execute 'removeChild' on 'Node'".
// This patch silently handles those errors instead of crashing the entire app.
if (typeof Node !== "undefined") {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode) {
        return originalRemoveChild.call(child.parentNode, child) as T;
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return originalInsertBefore.call(this, newNode, null) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

if (sessionStorage.getItem(SW_RELOAD_KEY) === BUILD_MARKER) {
  sessionStorage.removeItem(SW_RELOAD_KEY);
}

// --- Module loading recovery ---
// Handle chunk load errors (common after new deployments where old hashes are gone)
globalThis.addEventListener("error", (e) => {
  const msg = e.message ?? e.error?.message ?? "";
  if (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("dynamically imported module") ||
    msg.includes("is not matching its integrity")
  ) {
    console.warn("Módulo dinâmico falhou ao carregar. Recarregando a página...", e);
    globalThis.location.reload();
  }
}, true);

globalThis.addEventListener("unhandledrejection", (e) => {
  const msg = e.reason?.message ?? "";
  if (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("dynamically imported module") ||
    e.reason?.name === "ChunkLoadError"
  ) {
    console.warn("Rejeição de módulo dinâmico detectada. Recarregando a página...", e.reason);
    globalThis.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
);
