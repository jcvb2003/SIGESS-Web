import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { memberService } from "../../services/memberService";
import { MemberRegistrationForm } from "../../types/member.types";
import { MemberModalHeader } from "./MemberModalHeader";
import { MemberModalActions } from "./MemberModalActions";
import { MemberDetailsSkeleton } from "./MemberDetailsSkeleton";
import { PrimaryInfoTab } from "./tabs/PrimaryInfoTab";
import { ComplementaryInfoTab } from "./tabs/ComplementaryInfoTab";
import { handleExternalLogin } from "@/shared/utils/browserDetection";
import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

interface MemberDetailsModalProps {
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (id: string, member: MemberRegistrationForm) => void;
  onDelete: (id: string, member: MemberRegistrationForm) => void;
  onDocuments: (id: string, member: MemberRegistrationForm) => void;
}

export function MemberDetailsModal({
  memberId,
  open,
  onOpenChange,
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
    queryKey: ["member", memberId],
    queryFn: () => (memberId ? memberService.getMemberById(memberId) : null),
    enabled: !!memberId && open,
  });

  const handleEdit = () => {
    if (memberId && member) onEdit(memberId, member);
  };
  const handleDelete = () => {
    if (memberId && member) onDelete(memberId, member);
  };
  const handleDocuments = () => {
    if (memberId && member) onDocuments(memberId, member);
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

        <Tabs
          defaultValue="primary"
          className="flex-1 flex flex-col overflow-hidden min-h-0"
        >
          <div className="px-5 sm:px-6 w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 pt-4 pb-3 sm:pb-0">
            <TabsList className="w-full h-10 overflow-hidden bg-muted/50 border border-border/30">
              <TabsTrigger
                value="primary"
                className="flex-1 sm:px-5 data-[state=active]:shadow-sm"
              >
                Dados Principais
              </TabsTrigger>
              <TabsTrigger
                value="complementary"
                className="flex-1 sm:px-5 data-[state=active]:shadow-sm"
              >
                Dados Complementares
              </TabsTrigger>
            </TabsList>

            <div className="hidden sm:flex items-center gap-2 ml-4">
              <div className="h-7 w-px bg-border/40 mr-2" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-9 h-9 p-0 overflow-hidden border-border/50 hover:border-primary/30 transition-all hover:bg-accent shrink-0"
                      onClick={() =>
                        handleExternalLogin(
                          "https://servicos.acesso.gov.br/",
                          member.cpf || "",
                          member.senhaGovInss || "",
                          member.nome || "",
                        )
                      }
                    >
                      <img
                        src="https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/atendimento-gov.br/imagens/gov-br_logo-svg.png/@@images/image.png"
                        alt="GOV.BR"
                        className="w-[78%] h-[78%] object-contain"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Acessar GOV.BR</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-9 h-9 p-0 overflow-hidden border-border/50 hover:border-primary/30 transition-all hover:bg-accent shrink-0"
                      onClick={() =>
                        handleExternalLogin(
                          "https://login.esocial.gov.br/login.aspx",
                          member.cpf || "",
                          member.senhaGovInss || "",
                          member.nome || "",
                        )
                      }
                    >
                      <img
                        src="https://www.gov.br/esocial/pt-br/arquivos/imagens/esocial-vertical/@@images/image.jpeg"
                        alt="eSocial"
                        className="w-[68%] h-[68%] object-contain"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Acessar eSocial</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="hidden sm:flex items-center ml-4">
              <div className="h-7 w-px bg-border/40 mr-4" />
              <MemberModalActions
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDocuments={handleDocuments}
                onFinance={handleFinance}
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden px-5 sm:px-6 pt-4 pb-0 sm:pb-6 bg-muted/20 min-h-0">
            <TabsContent
              value="primary"
              className="h-full m-0 data-[state=active]:flex flex-col"
            >
              <PrimaryInfoTab member={member} />
            </TabsContent>
            <TabsContent
              value="complementary"
              className="h-full m-0 data-[state=active]:flex flex-col"
            >
              <ComplementaryInfoTab member={member} />
            </TabsContent>
          </div>
        </Tabs>

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
      <DialogContent className="w-screen sm:w-full sm:max-w-5xl h-dvh sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-none sm:rounded-2xl border-none sm:border sm:border-border/50 shadow-none sm:shadow-2xl">
        <DialogTitle className="sr-only">Detalhes do Sócio</DialogTitle>
        <DialogDescription className="sr-only">
          Visualização detalhada e edição das informações do sócio.
        </DialogDescription>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

