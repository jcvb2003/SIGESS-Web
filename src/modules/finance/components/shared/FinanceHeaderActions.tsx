import { History, Settings as SettingsIcon, Zap } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface FinanceHeaderActionsProps {
  readonly isAdmin: boolean;
  readonly onOpenAudit: () => void;
  readonly onOpenSettings: () => void;
  readonly onOpenBatchCharge?: () => void;
}

interface HeaderActionButtonProps {
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly onClick: () => void;
}

function HeaderActionButton({ label, icon: Icon, onClick }: HeaderActionButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 gap-2 rounded-xl px-4 bg-background shadow-sm"
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span className="inline text-xs font-bold uppercase tracking-wide">{label}</span>
    </Button>
  );
}

export function FinanceHeaderActions({
  isAdmin,
  onOpenBatchCharge,
  onOpenAudit,
  onOpenSettings,
}: FinanceHeaderActionsProps) {
  if (!isAdmin) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {onOpenBatchCharge && (
        <HeaderActionButton label="Cobranças do mês" icon={Zap} onClick={onOpenBatchCharge} />
      )}
      <HeaderActionButton label="Auditoria" icon={History} onClick={onOpenAudit} />
      <HeaderActionButton label="Configurações" icon={SettingsIcon} onClick={onOpenSettings} />
    </div>
  );
}
