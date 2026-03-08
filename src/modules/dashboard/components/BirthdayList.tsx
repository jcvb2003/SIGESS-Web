import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, PartyPopper } from "lucide-react"

interface Member {
  id: string
  nome: string
  data_de_nascimento?: string
  fotos?: { url: string }[] | null
}

interface BirthdayListProps {
  members?: Member[]
  loading?: boolean
}

export function BirthdayList({ members = [], loading }: BirthdayListProps) {
  const today = new Date()
  const todayFormatted = format(today, "d 'de' MMMM", { locale: ptBR })

  return (
    <Card className="col-span-1 h-full shadow-sm hover:shadow-md transition-all duration-300 border-none bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
           <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
            <Calendar className="h-4 w-4" />
          </div>
          Aniversariantes de Hoje ({todayFormatted})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
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
              <PartyPopper className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum aniversariante hoje.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {members.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-accent/5 to-transparent hover:from-accent/10 border border-accent/10 hover:border-accent/20 transition-all duration-200 group cursor-pointer"
              >
                <Avatar className="h-10 w-10 border-2 border-accent/20 group-hover:border-accent/40 transition-colors shadow-sm">
                  <AvatarImage src={member.fotos?.[0]?.url} alt={member.nome} className="object-cover" />
                  <AvatarFallback className="bg-accent/10 text-accent font-bold text-xs">
                    {member.nome.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-none truncate text-foreground group-hover:text-accent transition-colors">
                    {member.nome}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <span className="text-accent font-bold animate-pulse flex items-center gap-1">
                      <PartyPopper className="h-3 w-3" />
                      Parabéns!
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
