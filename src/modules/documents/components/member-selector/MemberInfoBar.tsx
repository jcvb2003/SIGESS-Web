
import { useDocumentMember } from "../../context/DocumentMemberContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function MemberInfoBar() {
  const { fullMemberData, isLoading } = useDocumentMember();

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-card mt-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
    );
  }

  if (!fullMemberData) return null;

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm mt-4">
      <Avatar className="h-12 w-12 border-2 border-primary/10">
        <AvatarImage src={fullMemberData.foto_url || undefined} alt={fullMemberData.nome} />
        <AvatarFallback className="bg-primary/5 text-primary">
          {fullMemberData.nome.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{fullMemberData.nome}</h3>
          <Badge variant={fullMemberData.situacao?.includes('ATIVO') ? 'default' : 'secondary'}>
            {fullMemberData.situacao || 'SITUAÇÃO DESCONHECIDA'}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
          <span>CPF: {fullMemberData.cpf}</span>
          {fullMemberData.rg && <span>RG: {fullMemberData.rg}</span>}
          {fullMemberData.codigo_do_socio && <span>Matrícula: {fullMemberData.codigo_do_socio}</span>}
        </div>
      </div>
    </div>
  );
}
