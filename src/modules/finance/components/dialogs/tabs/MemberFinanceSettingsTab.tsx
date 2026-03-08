import { useState, useEffect } from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Loader2, Search, User, Plus } from "lucide-react";
import { MemberFinanceConfigForm } from "../../forms/MemberFinanceConfigForm";
import { useDocumentMemberSearch } from "@/modules/documents/hooks/useDocumentMemberSearch";
import { useDebounce } from "@/shared/hooks/useDebounce";

export function MemberFinanceSettingsTab() {
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberCpf, setSelectedMemberCpf] = useState<string | null>(null);
  const { searchMembers, isLoading: isSearchLoading } = useDocumentMemberSearch();
  const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof searchMembers>>>([]);

  const debouncedSearch = useDebounce(memberSearch, 300);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearch.length >= 3) {
        const results = await searchMembers(debouncedSearch);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };
    performSearch();
  }, [debouncedSearch, searchMembers]);

  return (
    <ScrollArea className="h-full px-6">
      <div className="py-6 space-y-6">
        <div>
          <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 block">
            Localizar Sócio
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou matrícula..."
              className="pl-10 h-11 text-sm bg-background border-border/50 focus-visible:ring-primary rounded-xl"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
          </div>

          {(() => {
            if (isSearchLoading) {
              return (
                <div className="mt-4 flex items-center justify-center py-8 bg-muted/20 rounded-xl border border-dashed border-border/50">
                  <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                  <span className="text-xs text-muted-foreground font-medium tracking-tight">Buscando sócios...</span>
                </div>
              );
            }

            if (searchResults.length > 0) {
              return (
                <div className="mt-2 divide-y border rounded-xl overflow-hidden bg-card shadow-sm ring-1 ring-border/20">
                  {searchResults.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setSelectedMemberCpf(member.cpf);
                        setSearchResults([]);
                        setMemberSearch("");
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left group"
                    >
                      <Avatar className="h-8 w-8 border bg-muted/30">
                        <AvatarFallback className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                          {member.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{member.nome}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">CPF: {member.cpf}</p>
                      </div>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:scale-110" />
                    </button>
                  ))}
                </div>
              );
            }

            if (memberSearch.length >= 3) {
              return (
                <div className="mt-4 text-center py-8 bg-muted/20 rounded-xl border border-dashed border-border/50">
                  <p className="text-xs text-muted-foreground font-medium">Nenhum sócio encontrado para "{memberSearch}"</p>
                </div>
              );
            }

            return null;
          })()}
        </div>

        {selectedMemberCpf && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-4 bg-primary/5 p-3 rounded-xl border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-tighter">Editando Sócio</p>
                  <p className="text-[10px] font-medium text-primary">CPF: {selectedMemberCpf}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMemberCpf(null)}
                className="h-7 text-[10px] uppercase font-bold text-muted-foreground hover:text-destructive transition-colors"
              >
                Trocar
              </Button>
            </div>
            
            <div className="space-y-4">
              <MemberFinanceConfigForm
                cpf={selectedMemberCpf}
                mode="isencao"
                onClose={() => {}}
              />
               <MemberFinanceConfigForm
                cpf={selectedMemberCpf}
                mode="regime"
                onClose={() => {}}
              />
               <MemberFinanceConfigForm
                cpf={selectedMemberCpf}
                mode="liberacao"
                onClose={() => {}}
              />
            </div>
          </div>
        )}
        
        {!selectedMemberCpf && !memberSearch && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30">
            <User className="h-12 w-12 mb-3 stroke-[1px]" />
            <p className="text-xs font-bold uppercase tracking-widest">Selecione um sócio acima</p>
            <p className="text-[10px] mt-1 font-medium italic">Gerencie isenções, liberações e regimes individuais</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
