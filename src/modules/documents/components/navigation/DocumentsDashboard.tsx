import { useState, useMemo } from "react";
import { DefesoRequestDocument } from "../templates/defeso-request/DefesoRequestDocument";
import { useDocumentMember } from "../../context/useDocumentMember";
import { Button } from "@/shared/components/ui/button";
import {
  FileText,
  Gavel,
  Loader2,
  Search,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { WitnessDialog } from "../modals/WitnessDialog";
import { toast } from "sonner";
import { usePdfTemplates } from "../../hooks/usePdfTemplates";
import { pdfService } from "../../services/pdf/pdfService";
import { processSimpleStatementData } from "../../services/pdf/pdfDataProcessor";
import { useEntityData } from "@/shared/hooks/useEntityData";
import { MemberSelect } from "../member-selector/MemberSelect";
import { DocumentTemplate } from "@/modules/settings/types/settings.types";
import { useFinancialStatus } from "@/modules/finance/hooks/data/useFinancialStatus";
import { useFinanceSettings } from "@/modules/finance/hooks/data/useFinanceSettings";
import { useMemberConfig } from "@/modules/finance/hooks/data/useMemberConfig";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";

export function DocumentsDashboard() {
  const { selectedMember, fullMemberData } = useDocumentMember();
  const { entity } = useEntityData();
  const [activeModal, setActiveModal] = useState<
    "residence" | "representation" | null
  >(null);

  const {
    residenceTemplates,
    representationTemplates,
    defesoTemplates,
    isLoading: isLoadingTemplates,
  } = usePdfTemplates();

  // Finance integration
  const { isOverdue, isLoading: isFinanceLoading } = useFinancialStatus(
    fullMemberData?.cpf ?? null,
    new Date().getFullYear(),
  );
  const { settings } = useFinanceSettings();
  const { config } = useMemberConfig(fullMemberData?.cpf ?? null);

  const financialIssues = useMemo(() => {
    if (!fullMemberData || !settings) return null;
    if (config?.isento) return null;
    if (config?.liberado_pelo_presidente) return null;

    if (isOverdue && settings.bloquear_inadimplente) {
      return {
        type: "blocking" as const,
        message: "Sócio inadimplente. Emissão de documentos bloqueada conforme regras da entidade.",
      };
    }

    if (isOverdue) {
      return {
        type: "warning" as const,
        message: "Sócio possui pendências financeiras. Recomendável regularizar antes da emissão.",
      };
    }

    return null;
  }, [fullMemberData, settings, config, isOverdue]);

  if (!selectedMember) {
    return (
      <MemberSelect>
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm mt-4 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer group">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            <Search className="h-6 w-6" />
          </div>
          <div className="flex-1 flex flex-col items-start gap-1">
            <h3 className="font-semibold text-lg">Buscar Sócio</h3>
            <p className="text-sm text-muted-foreground">
              Clique para pesquisar por nome, CPF ou matrícula
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </MemberSelect>
    );
  }

  const handleGenerateResidence = async (data: {
    witnesses?: {
      witness1: {
        name: string;
        cpf: string;
        rg: string;
      };
      witness2: {
        name: string;
        cpf: string;
        rg: string;
      };
    };
    modelId?: string;
    documentDate?: string;
  }) => {
    if (financialIssues?.type === "blocking") {
      toast.error(financialIssues.message);
      return;
    }

    if (!fullMemberData || !data.modelId) {
      toast.error("Dados incompletos para geração do documento.");
      return;
    }
    const model = (residenceTemplates as any[]).find((m) => m.id === data.modelId);
    if (!model || !model.fileUrl) {
      toast.error("Modelo inválido.");
      return;
    }
    const toastId = toast.loading("Gerando Declaração de Residência...");
    try {
      const witnessData: Record<string, string> = {};
      if (data.witnesses) {
        if (data.witnesses.witness1) {
          witnessData["nome_testemunha1"] = data.witnesses.witness1.name || "";
          witnessData["cpf_testemunha1"] = data.witnesses.witness1.cpf || "";
          witnessData["rg_testemunha1"] = data.witnesses.witness1.rg || "";
        }
        if (data.witnesses.witness2) {
          witnessData["nome_testemunha2"] = data.witnesses.witness2.name || "";
          witnessData["cpf_testemunha2"] = data.witnesses.witness2.cpf || "";
          witnessData["rg_testemunha2"] = data.witnesses.witness2.rg || "";
        }
      }
      const dataMap = processSimpleStatementData(
        fullMemberData,
        entity ?? null,
        witnessData,
        data.documentDate,
      );
      const success = await pdfService.generatePdfDocument(
        model as unknown as DocumentTemplate,
        dataMap,
        `declaracao_residencia_${fullMemberData.cpf}.pdf`,
      );
      if (success) {
        toast.success("Declaração de Residência gerada com sucesso!", {
          id: toastId,
        });
      } else {
        toast.dismiss(toastId);
      }
    } catch (error) {
      toast.error("Erro ao gerar documento.", { id: toastId });
      console.error(error);
    }
  };

  const handleGenerateRepresentation = async (data: {
    witnesses?: {
      witness1: {
        name: string;
        cpf: string;
        rg: string;
      };
      witness2: {
        name: string;
        cpf: string;
        rg: string;
      };
    };
    modelId?: string;
    documentDate?: string;
  }) => {
    if (financialIssues?.type === "blocking") {
      toast.error(financialIssues.message);
      return;
    }

    if (!fullMemberData || !data.modelId) {
      toast.error("Dados incompletos para geração do documento.");
      return;
    }
    const model = (representationTemplates as any[]).find((m) => m.id === data.modelId);
    if (!model || !model.fileUrl) {
      toast.error("Modelo inválido.");
      return;
    }
    const toastId = toast.loading("Gerando Termo de Representação...");
    try {
      const witnessData: Record<string, string> = {};
      if (data.witnesses) {
        if (data.witnesses.witness1) {
          witnessData["nome_testemunha1"] = data.witnesses.witness1.name || "";
          witnessData["cpf_testemunha1"] = data.witnesses.witness1.cpf || "";
          witnessData["rg_testemunha1"] = data.witnesses.witness1.rg || "";
        }
        if (data.witnesses.witness2) {
          witnessData["nome_testemunha2"] = data.witnesses.witness2.name || "";
          witnessData["cpf_testemunha2"] = data.witnesses.witness2.cpf || "";
          witnessData["rg_testemunha2"] = data.witnesses.witness2.rg || "";
        }
      }
      const dataMap = processSimpleStatementData(
        fullMemberData,
        entity ?? null,
        witnessData,
        data.documentDate,
      );
      const success = await pdfService.generatePdfDocument(
        model as unknown as DocumentTemplate,
        dataMap,
        `termo_representacao_${fullMemberData.cpf}.pdf`,
      );
      if (success) {
        toast.success("Termo de Representação gerado com sucesso!", {
          id: toastId,
        });
      } else {
        toast.dismiss(toastId);
      }
    } catch (error) {
      toast.error("Erro ao gerar documento.", { id: toastId });
      console.error(error);
    }
  };

  const residenceModels = residenceTemplates;
  const representationModels = representationTemplates;
  const defesoModels = defesoTemplates;

  if (isLoadingTemplates || isFinanceLoading) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {financialIssues && (
        <Alert
          variant={
            financialIssues.type === "blocking" ? "destructive" : "default"
          }
          className={
            financialIssues.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400"
              : ""
          }
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">Aviso Financeiro</AlertTitle>
          <AlertDescription className="text-sm">
            {financialIssues.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="h-auto min-h-24 py-4 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/30 hover:text-primary border-dashed text-center whitespace-normal transition-all"
          onClick={() => setActiveModal("residence")}
          disabled={
            residenceModels.length === 0 || financialIssues?.type === "blocking"
          }
        >
          <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm sm:text-base leading-tight">
            Declaração de Residência
          </span>
          {residenceModels.length === 0 && (
            <span className="text-xs text-muted-foreground">(Sem modelos)</span>
          )}
        </Button>

        <Button
          variant="outline"
          className="h-auto min-h-24 py-4 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/30 hover:text-primary border-dashed text-center whitespace-normal transition-all"
          onClick={() => setActiveModal("representation")}
          disabled={
            representationModels.length === 0 ||
            financialIssues?.type === "blocking"
          }
        >
          <Gavel className="h-8 w-8 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm sm:text-base leading-tight">
            Termo de Representação
          </span>
          {representationModels.length === 0 && (
            <span className="text-xs text-muted-foreground">(Sem modelos)</span>
          )}
        </Button>
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <DefesoRequestDocument
          availableModels={defesoModels}
          isBlocked={financialIssues?.type === "blocking"}
        />
      </div>

      <WitnessDialog
        open={activeModal === "residence"}
        onOpenChange={(open) => !open && setActiveModal(null)}
        title="Declaração de Residência"
        description="Selecione o modelo e preencha os dados das testemunhas caso necessário."
        onConfirm={handleGenerateResidence}
        availableModels={residenceModels}
      />

      <WitnessDialog
        open={activeModal === "representation"}
        onOpenChange={(open) => !open && setActiveModal(null)}
        title="Termo de Representação"
        description="Selecione o modelo e preencha os dados das testemunhas caso necessário."
        onConfirm={handleGenerateRepresentation}
        availableModels={representationModels}
      />
    </div>
  );
}

