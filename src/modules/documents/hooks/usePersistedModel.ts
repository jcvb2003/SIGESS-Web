import { useState, useEffect } from "react";

/**
 * Persiste o modelo de documento selecionado no localStorage.
 * Cada tipo de documento usa uma chave distinta.
 */
export function usePersistedModel(storageKey: string) {
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      return localStorage.getItem(storageKey) ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    try {
      if (selectedModel) {
        localStorage.setItem(storageKey, selectedModel);
      }
    } catch {
      // localStorage indisponível (modo privado restrito, etc.)
    }
  }, [selectedModel, storageKey]);

  return [selectedModel, setSelectedModel] as const;
}
