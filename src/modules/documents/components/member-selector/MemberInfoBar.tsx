import { useState, useEffect } from "react";
import { useDocumentMember } from "../../context/useDocumentMember";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { MemberSelect } from "./MemberSelect";
import { Button } from "@/shared/components/ui/button";
import { RotateCcw, User, Eye, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogHeader,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { MemberDetailsModal } from "@/modules/members/components/modal/MemberDetailsModal";
import { RegistrationForm } from "@/modules/members/components/registration/RegistrationForm";
import { fromMemberRecord } from "@/modules/members/services/memberDataTransformer";
import { SocioRow } from "@/modules/members/types/member.types";

export function MemberInfoBar() {
  const { fullMemberData, isLoading, refetchMember } = useDocumentMember();
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  // Reseta o erro de foto quando o membro muda
  useEffect(() => {
    setPhotoError(false);
  }, [fullMemberData?.id]);
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

  const hasPhoto = !!fullMemberData.foto_url && !photoError;
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm mt-4">
      <Dialog>
        <DialogTrigger asChild>
          <div
            className={`relative h-16 w-12 rounded-md border-2 border-border overflow-hidden bg-muted flex items-center justify-center shrink-0 shadow-sm ${hasPhoto ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
          >
            {hasPhoto ? (
              <img
                src={fullMemberData.foto_url!}
                alt={fullMemberData.nome}
                onError={() => setPhotoError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <User className="h-5 w-5 opacity-50" />
              </div>
            )}
          </div>
        </DialogTrigger>
        {hasPhoto && (
          <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
            <DialogTitle className="sr-only">
              Foto de {fullMemberData.nome}
            </DialogTitle>
            <div className="flex items-center justify-center">
              <img
                src={fullMemberData.foto_url!}
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

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setIsViewModalOpen(true)}
        >
          <Eye className="h-4 w-4" />
          <span className="hidden lg:inline">Detalhes</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden lg:inline">Editar</span>
        </Button>

        <div className="h-8 w-px bg-border/60 mx-1 hidden sm:block" />

        <MemberSelect>
          <Button variant="default" size="sm" className="gap-2 shadow-xs">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Trocar</span>
          </Button>
        </MemberSelect>
      </div>

      {/* Modais de Ação */}
      <MemberDetailsModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        memberUuid={fullMemberData.id}
        onEdit={() => {
          setIsViewModalOpen(false);
          setIsEditModalOpen(true);
        }}
        onDelete={() => {
          setIsViewModalOpen(false);
          // Opcional: implementar delete aqui também se desejado
        }}
        onDocuments={() => setIsViewModalOpen(false)}
      />

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none sm:border">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold">Editar Sócio</DialogTitle>
            <DialogDescription>
              Atualize as informações do cadastro necessários para a emissão dos documentos.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-2">
            <RegistrationForm
              memberUuid={fullMemberData.id}
              initialData={fromMemberRecord(fullMemberData as unknown as SocioRow)}
              onCancel={() => setIsEditModalOpen(false)}
              onSuccess={() => {
                setIsEditModalOpen(false);
                refetchMember();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
