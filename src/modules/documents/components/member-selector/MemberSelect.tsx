
import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/components/ui/drawer"
import { memberService } from "@/modules/members/services/memberService"
import { MemberListItem } from "@/modules/members/types/member.types"
import { useDocumentMember } from "../../context/DocumentMemberContext"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"

// Simple debounce hook implementation since the shared one was deleted
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

export function MemberSelect() {
  const { selectedMember, setSelectedMember } = useDocumentMember()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [members, setMembers] = useState<MemberListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debouncedSearch = useDebounce(searchTerm, 300)

  useEffect(() => {
    if (isOpen) {
      searchMembers(debouncedSearch)
    }
  }, [debouncedSearch, isOpen])

  const searchMembers = async (term: string) => {
    setIsLoading(true)
    try {
      // If term is empty, fetch recent or all (paginated)
      // Using existing service
      const result = await memberService.searchMembers({
        page: 1,
        pageSize: 10,
        searchTerm: term,
        statusFilter: 'all',
        localityCode: 'all'
      })
      setMembers(result.items)
    } catch (error) {
      console.error("Error searching members:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (member: MemberListItem) => {
    setSelectedMember({
      id: member.id,
      nome: member.nome || "",
      cpf: member.cpf || "",
      rg: "", // Service doesn't return RG in list, context will fetch full data
      foto_url: null // Service doesn't return photo in list
    })
    setIsOpen(false)
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full justify-between bg-background">
          <span className="truncate">
            {selectedMember ? selectedMember.nome : "Selecione um sócio..."}
          </span>
          <Search className="h-4 w-4 text-muted-foreground ml-2" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Selecionar Sócio</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou matrícula..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="h-[300px] overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">Carregando...</div>
              ) : members.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">Nenhum sócio encontrado.</div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleSelect(member)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {member.nome?.substring(0, 2).toUpperCase() || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium truncate">{member.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        CPF: {member.cpf} • Mat: {member.codigo_do_socio}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
