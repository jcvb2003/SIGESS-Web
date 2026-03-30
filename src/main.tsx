import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "./app/providers/AppProviders";
import { AppRouter } from "./app/router";
import "./app/styles/globals.css";

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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
);
