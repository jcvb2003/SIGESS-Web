import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, User } from "lucide-react"

interface Member {
  id: string
  nome: string
  created_at?: string
  data_de_admissao?: string
  fotos?: { url: string }[] | null
}

interface RecentMembersListProps {
  members?: Member[]
  loading?: boolean
}

export function RecentMembersList({ members = [], loading }: RecentMembersListProps) {
  return (
    <Card className="col-span-1 h-full shadow-sm hover:shadow-md transition-all duration-300 border-none bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          Membros Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className="p-3 rounded-full bg-muted/30">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum membro recente encontrado.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {members.map((member) => {
              const date = member.created_at || member.data_de_admissao
              return (
                <div 
                  key={member.id} 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all duration-200 group cursor-pointer border border-transparent hover:border-primary/10"
                >
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm group-hover:border-primary/20 transition-colors">
                    <AvatarImage src={member.fotos?.[0]?.url} alt={member.nome} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {member.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-none truncate text-foreground group-hover:text-primary transition-colors">
                      {member.nome}
                    </p>
                    {date && (
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                        {formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
