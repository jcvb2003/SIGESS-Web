import { PageHeader } from "@/shared/components/layout/PageHeader";
import { GovBatchAutomationPanel } from "@/modules/automation/components/GovBatchAutomationPanel";

export default function AutomationPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Automação"
        description="Organize rotinas, fluxos e futuras integrações automáticas do sistema em um módulo próprio."
      />

      <GovBatchAutomationPanel />
    </div>
  );
}
