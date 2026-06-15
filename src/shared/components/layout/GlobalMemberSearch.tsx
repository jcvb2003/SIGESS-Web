import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, User } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { memberService } from "@/modules/members/services/memberService";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { cn } from "@/shared/lib/utils";

interface SearchResult {
  id: string;
  nome: string | null;
  cpf: string | null;
  codigo_do_socio: string | null;
}

function maskCpf(cpf: string | null): string {
  if (!cpf) return "";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`;
}

interface GlobalMemberSearchProps {
  onSelect: (id: string) => void;
}

export function GlobalMemberSearch({ onSelect }: GlobalMemberSearchProps) {
  const { tenantId, unitId } = useActiveScope();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (value: string) => {
    if (value.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const result = await memberService.searchMembers(
        {
          page: 1,
          pageSize: 8,
          searchTerm: value,
          statusFilter: "all",
          localityCode: undefined,
          portariaId: null, // busca global: nunca filtra por portaria ativa
          birthMonth: "",
          gender: "all",
          rgpStatus: "all",
        },
        { tenantId, unitId },
      );
      setResults(
        result.items.map((m) => ({
          id: m.id,
          nome: m.nome,
          cpf: m.cpf,
          codigo_do_socio: m.codigo_do_socio,
        })),
      );
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, unitId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void search(value), 300);
  };

  const handleSelect = (id: string) => {
    setTerm("");
    setResults([]);
    setIsOpen(false);
    onSelect(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setTerm("");
    }
  };

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        {isLoading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
        )}
        <Input
          value={term}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Buscar sócio..."
          className="h-8 pl-8 pr-8 text-sm bg-muted/50 border-border/50 focus:bg-background"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-border/60 bg-background shadow-lg overflow-hidden">
          {results.map((m) => (
            <button
              key={m.id}
              type="button"
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-left text-sm",
                "hover:bg-muted/60 transition-colors",
              )}
              onClick={() => handleSelect(m.id)}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground leading-tight">
                  {m.nome || "—"}
                </p>
                <p className="truncate text-xs text-muted-foreground leading-tight">
                  {[m.codigo_do_socio, maskCpf(m.cpf)].filter(Boolean).join(" · ")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && !isLoading && term.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-border/60 bg-background shadow-lg px-3 py-4 text-center text-sm text-muted-foreground">
          Nenhum sócio encontrado.
        </div>
      )}
    </div>
  );
}
