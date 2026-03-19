import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { useDocumentMember } from "../../context/useDocumentMember";
import {
  useDocumentMemberSearch,
  DocumentMemberSearchResult,
} from "../../hooks/useDocumentMemberSearch";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}
export function MemberSelect({ children }: { children?: React.ReactNode }) {
  const { selectedMember, setSelectedMember } = useDocumentMember();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<DocumentMemberSearchResult[]>([]);
  const { searchMembers, isLoading } = useDocumentMemberSearch();
  const debouncedSearch = useDebounce(searchTerm, 300);
  const handleSearch = useCallback(
    async (term: string) => {
      const results = await searchMembers(term);
      setMembers(results);
    },
    [searchMembers],
  );
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        handleSearch(debouncedSearch);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [debouncedSearch, isOpen, handleSearch]);
  const handleSelect = (member: DocumentMemberSearchResult) => {
    setSelectedMember({
      id: member.id,
      nome: member.nome || "",
      cpf: member.cpf || "",
      rg: member.rg || "",
      foto_url: member.foto_url || null,
    });
    setIsOpen(false);
  };
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button
            variant="outline"
            className="w-full justify-between bg-background"
          >
            <span className="truncate">
              {selectedMember ? selectedMember.nome : "Selecione um sócio..."}
            </span>
            <Search className="h-4 w-4 text-muted-foreground ml-2" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col h-full"
      >
        <SheetHeader>
          <SheetTitle>Selecionar Sócio</SheetTitle>
          <SheetDescription>
            Busque e selecione um sócio para gerar documentos.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-4 py-4 overflow-hidden">
          <div className="relative shrink-0">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou matrícula..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                <span>Buscando...</span>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                <p>Nenhum sócio encontrado.</p>
                {searchTerm && (
                  <p className="text-xs mt-1">Tente outros termos de busca.</p>
                )}
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted border border-transparent hover:border-border cursor-pointer transition-all"
                  onClick={() => handleSelect(member)}
                >
                  <Avatar className="h-10 w-10 border bg-muted">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {member.nome?.substring(0, 2).toUpperCase() || "S"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium truncate text-sm">
                      {member.nome}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="bg-muted px-1.5 py-0.5 rounded">
                        CPF: {member.cpf}
                      </span>
                      {member.codigo_do_socio && (
                        <span className="bg-muted px-1.5 py-0.5 rounded">
                          Mat: {member.codigo_do_socio}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <SheetFooter className="mt-auto pt-2 border-t">
          <SheetClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Cancelar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
