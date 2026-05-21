import { PageHeader } from "@/shared/components/layout/PageHeader";
import { GovBatchAutomationPanel } from "@/modules/automation/components/GovBatchAutomationPanel";

export default function AutomationPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Automação"
        description="Digitação automática, Geração de Boletos e Preenchimento do REAP em lote."
      />

      <GovBatchAutomationPanel />
    </div>
  );
}
