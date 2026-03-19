import { useDocumentMember } from "../../context/useDocumentMember";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { MemberSelect } from "./MemberSelect";
import { Button } from "@/shared/components/ui/button";
import { RotateCcw, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
export function MemberInfoBar() {
  const { fullMemberData, isLoading } = useDocumentMember();
  if (isLoading) {
    return (
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-card mt-4">
        <Skeleton className="h-16 w-12 rounded-md" />
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
      <Dialog>
        <DialogTrigger asChild>
          <div
            className={`relative h-16 w-12 rounded-md border-2 border-border overflow-hidden bg-muted flex items-center justify-center shrink-0 shadow-sm ${fullMemberData.foto_url ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
          >
            {fullMemberData.foto_url ? (
              <img
                src={fullMemberData.foto_url}
                alt={fullMemberData.nome}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <User className="h-5 w-5 opacity-50" />
              </div>
            )}
          </div>
        </DialogTrigger>
        {fullMemberData.foto_url && (
          <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
            <DialogTitle className="sr-only">
              Foto de {fullMemberData.nome}
            </DialogTitle>
            <div className="flex items-center justify-center">
              <img
                src={fullMemberData.foto_url}
                alt={`Foto de ${fullMemberData.nome}`}
                className="max-h-[80vh] w-full object-contain rounded-md"
              />
            </div>
          </DialogContent>
        )}
      </Dialog>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{fullMemberData.nome}</h3>
          <Badge
            variant={
              fullMemberData.situacao?.includes("ATIVO")
                ? "default"
                : "secondary"
            }
          >
            {fullMemberData.situacao || "SITUAÇÃO DESCONHECIDA"}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
          <span>CPF: {fullMemberData.cpf}</span>
          {fullMemberData.rg && <span>RG: {fullMemberData.rg}</span>}
          {fullMemberData.codigo_do_socio && (
            <span>Matrícula: {fullMemberData.codigo_do_socio}</span>
          )}
        </div>
      </div>

      <MemberSelect>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Trocar</span>
        </Button>
      </MemberSelect>
    </div>
  );
}
