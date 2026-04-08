import { useState } from "react";
import { MemberRegistrationForm } from "../../types/member.types";
import { MemberStatusBadge } from "../MemberStatusBadge";
import { User, Loader2, Copy, KeyRound, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { usePhotoManager } from "../../hooks/registration/usePhotoManager";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { useFinancialStatus } from "../../../finance/hooks/data/useFinancialStatus";
import { FinancialStatusBadge } from "@/modules/finance/components/shared/FinancialStatusBadge";

interface MemberModalHeaderProps {
  member: MemberRegistrationForm;
}

function MemberAvatar({
  member,
  photoUrl,
  isLoading,
}: Readonly<{
  member: MemberRegistrationForm;
  photoUrl: string | null;
  isLoading: boolean;
}>) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [prevPhotoUrl, setPrevPhotoUrl] = useState(photoUrl);

  // Reset image loaded and error states when photoUrl changes
  if (photoUrl !== prevPhotoUrl) {
    setPrevPhotoUrl(photoUrl);
    setImageLoaded(false);
    setImageError(false);
  }

  const showSpinner = !imageLoaded && !imageError && (isLoading || !!photoUrl);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const renderAvatarContent = () => {
    // Se não há foto, houve erro no carregamento ou terminou o carregamento inicial sem URL
    if ((!photoUrl || imageError) && !isLoading) {
      return (
        <div className="flex flex-col items-center gap-0.5 sm:gap-1 text-muted-foreground">
          <User className="h-5 w-5 sm:h-8 sm:w-8 opacity-40" />
          <span className="text-[10px] sm:text-sm font-bold tracking-wide">
            {getInitials(member.nome)}
          </span>
        </div>
      );
    }

    return (
      <>
        {showSpinner && (
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
        )}
        {photoUrl && !imageError && (
          <img
            src={photoUrl}
            alt={member.nome}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0 absolute"
            }`}
          />
        )}
      </>
    );
  };

  const canShowDialog = photoUrl && !imageError;

  const Content = (
    <div
      className={`
        relative h-14 w-11 sm:h-[6.5rem] sm:w-[5rem] rounded-lg sm:rounded-xl overflow-hidden
        bg-gradient-to-br from-muted to-muted/60
        border-2 border-border/50
        flex items-center justify-center shrink-0
        shadow-md ring-2 ring-background
        ${canShowDialog ? "cursor-pointer hover:opacity-90 hover:shadow-lg transition-all" : ""}
      `}
    >
      {renderAvatarContent()}
    </div>
  );

  return (
    <Dialog>
      {canShowDialog ? (
        <DialogTrigger asChild>{Content}</DialogTrigger>
      ) : (
        Content
      )}

      {canShowDialog && (
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
          <DialogTitle className="sr-only">Foto de {member.nome}</DialogTitle>
          <div className="flex items-center justify-center">
            <img
              src={photoUrl}
              alt={`Foto de ${member.nome}`}
              className="max-h-[80vh] w-full object-contain rounded-xl"
            />
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

export function MemberModalHeader({
  member,
}: Readonly<MemberModalHeaderProps>) {
  const { photoUrl, isLoading: photoLoading } = usePhotoManager({
    cpf: member.cpf,
    initialPhotoUrl: member.fotos?.[0]?.foto_url,
  });

  const { isOverdue, isLoading: financeLoading } = useFinancialStatus(
    member.cpf,
    new Date().getFullYear(),
  );

  return (
    <div className="relative flex flex-row items-center sm:items-stretch gap-3 sm:gap-5 pb-3 sm:pb-5 border-b border-border/40 pr-10">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-transparent to-primary/[0.02] rounded-t-lg pointer-events-none" />

      <MemberAvatar
        member={member}
        photoUrl={photoUrl}
        isLoading={photoLoading}
      />

      <div className="relative flex flex-col items-start justify-center gap-1 sm:gap-2 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
          <h2 className="text-base sm:text-2xl font-bold tracking-tight text-foreground leading-tight truncate max-w-full">
            {member.nome}
          </h2>
          {!financeLoading && (
            <FinancialStatusBadge
              status={isOverdue ? "overdue" : "ok"}
              className="text-[10px] uppercase font-bold"
            />
          )}
        </div>

        <div className="flex flex-row flex-wrap items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <span className="font-medium text-foreground/70">Matrícula:</span>
            <span className="font-semibold text-foreground">
              {member.codigoDoSocio}
            </span>
          </p>
          <span className="hidden sm:inline text-border">•</span>
          <p className="flex items-center gap-1.5">
            <span className="font-medium text-foreground/70">CPF:</span>
            <span className="font-semibold text-foreground">{member.cpf}</span>
            {member.cpf && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(member.cpf);
                  toast.success("CPF copiado para área de transferência!");
                }}
                className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
                title="Copiar CPF"
              >
                <Copy className="h-3 w-3" />
              </button>
            )}
          </p>
          <span className="hidden sm:inline text-border">•</span>
          <p className="flex items-center gap-1.5">
            <KeyRound className="h-3 w-3 text-muted-foreground/60 hidden sm:inline" />
            <span className="font-medium text-foreground/70">Senha GOV:</span>
            <span className="font-semibold text-foreground">
              {member.senhaGovInss || "—"}
            </span>
            {member.senhaGovInss && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(member.senhaGovInss);
                  toast.success(
                    "Senha GOV copiada para área de transferência!",
                  );
                }}
                className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
                title="Copiar Senha GOV"
              >
                <Copy className="h-3 w-3" />
              </button>
            )}
          </p>
          <span className="hidden sm:inline text-border">•</span>
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3 text-muted-foreground/60 hidden sm:inline" />
            <span className="font-medium text-foreground/70">Adesão:</span>
            <span className="font-semibold text-foreground">
              {formatDate(member.dataDeAdmissao) || "—"}
            </span>
          </p>
          <span className="hidden sm:inline text-border">•</span>
          <MemberStatusBadge
            status={member.situacao}
            className="text-[10px] sm:text-xs py-0.5"
          />
        </div>
      </div>
    </div>
  );
}
