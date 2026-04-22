import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { EntityTabs } from "@/shared/components/layout/EntityTabs";
import { memberService } from "../../services/memberService";
import { memberQueryKeys } from "../../queryKeys";
import { MemberRegistrationForm } from "../../types/member.types";
import { MemberModalHeader } from "./MemberModalHeader";
import { MemberModalActions } from "./MemberModalActions";
import { MemberDetailsSkeleton } from "./MemberDetailsSkeleton";
import { PrimaryInfoTab } from "./tabs/PrimaryInfoTab";
import { ComplementaryInfoTab } from "./tabs/ComplementaryInfoTab";
import { ExternalPortals } from "./ExternalPortals";



interface MemberDetailsModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly memberUuid: string | null;
  readonly onEdit: (uuid: string, member: MemberRegistrationForm) => void;
  readonly onDelete: (uuid: string, member: MemberRegistrationForm) => void;
  readonly onDocuments: (uuid: string, member: MemberRegistrationForm) => void;
}

export function MemberDetailsModal({
  open,
  onOpenChange,
  memberUuid,
  onEdit,
  onDelete,
  onDocuments,
}: Readonly<MemberDetailsModalProps>) {
  const navigate = useNavigate();
  const {
    data: member,
    isLoading,
    error,
  } = useQuery({
    queryKey: memberUuid ? memberQueryKeys.detail(memberUuid) : ["member", null],
    queryFn: () => (memberUuid ? memberService.getMemberById(memberUuid) : null),
    enabled: !!memberUuid && open,
  });

  const handleEdit = () => {
    if (memberUuid && member) onEdit(memberUuid, member);
  };
  const handleDelete = () => {
    if (memberUuid && member) onDelete(memberUuid, member);
  };
  const handleDocuments = () => {
    if (memberUuid && member) onDocuments(memberUuid, member);
  };
  const handleFinance = () => {
    if (member?.cpf) {
      navigate(`/finance?searchTerm=${member.cpf}`);
      onOpenChange(false);
    }
  };

  const renderContent = () => {
    // Enquanto carrega ou se não houver membro/id e não houver erro, mostra o skeleton.
    // Isso evita o flash da tela de erro ao fechar o modal (quando memberId e member se tornam null).
    if (isLoading || (!member && !error)) {
      return <MemberDetailsSkeleton />;
    }

    if (error || !member) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
          <div className="rounded-full bg-destructive/10 p-4">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-destructive">
            Erro ao carregar dados
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            Não foi possível carregar os dados do sócio.
          </p>
        </div>
      );
    }

    return (
      <>
        <DialogHeader className="px-5 sm:px-6 pt-5 sm:pt-6 pb-0">
          <MemberModalHeader member={member} />
        </DialogHeader>

        <EntityTabs
          defaultValue="primary"
          variant="full-height"
          className="flex-1 min-h-0"
          items={[
            {
              value: "primary",
              label: "Dados Principais",
              content: <PrimaryInfoTab member={member} />
            },
            {
              value: "complementary",
              label: "Dados Complementares",
              content: <ComplementaryInfoTab member={member} />
            }
          ]}
          rightActions={
            <>
              <ExternalPortals
                cpf={member.cpf || ""}
                senhaGov={member.senhaGovInss || ""}
                nome={member.nome || ""}
                member={member}
              />
              <div className="hidden sm:flex items-center ml-2">
                <div className="h-7 w-px bg-border/40 mr-4" />
                <MemberModalActions
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDocuments={handleDocuments}
                  onFinance={handleFinance}
                />
              </div>
            </>
          }
        />

        <div className="sm:hidden border-t border-border/40 bg-background px-4 py-3 shrink-0">
          <MemberModalActions
            variant="mobile"
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDocuments={handleDocuments}
            onFinance={handleFinance}
          />
        </div>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen sm:w-full sm:max-w-7xl h-dvh sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-none sm:rounded-2xl border-none sm:border sm:border-border/50 shadow-none sm:shadow-2xl">
        <DialogTitle className="sr-only">Detalhes do Sócio</DialogTitle>
        <DialogDescription className="sr-only">
          Visualização detalhada e edição das informações do sócio.
        </DialogDescription>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

