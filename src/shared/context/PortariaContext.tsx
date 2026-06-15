import { createContext, useContext, useEffect, useState } from "react";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

interface PortariaContextValue {
  activePortariaId: string | null;
  setActivePortariaId: (id: string | null) => void;
}

const PortariaContext = createContext<PortariaContextValue>({
  activePortariaId: null,
  setActivePortariaId: () => undefined,
});

export function PortariaProvider({ children }: { children: React.ReactNode }) {
  const [activePortariaId, setActivePortariaId] = useState<string | null>(null);
  const { unitId } = useActiveScope();

  // Reset ao trocar de polo: evita filtro stale de portaria do polo anterior
  useEffect(() => {
    setActivePortariaId(null);
  }, [unitId]);

  return (
    <PortariaContext.Provider value={{ activePortariaId, setActivePortariaId }}>
      {children}
    </PortariaContext.Provider>
  );
}

export function usePortariaScope() {
  return useContext(PortariaContext);
}
