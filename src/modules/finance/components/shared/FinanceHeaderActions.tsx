import { History, Receipt, Settings as SettingsIcon, SlidersHorizontal, FileSpreadsheet } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface FinanceHeaderActionsProps {
  readonly isAdmin: boolean;
  readonly hasActiveAdvancedFilters: boolean;
  readonly onOpenFilters: () => void;
  readonly onOpenPaymentsReport: () => void;
  readonly onOpenDaesReport: () => void;
  readonly onOpenAudit: () => void;
  readonly onOpenSettings: () => void;
}

interface HeaderActionButtonProps {
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly onClick: () => void;
  readonly showPulse?: boolean;
}

function HeaderActionButton({
  label,
  icon: Icon,
  onClick,
  showPulse = false,
}: HeaderActionButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 gap-2 rounded-xl px-4 bg-background shadow-sm"
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span className="inline text-xs font-bold uppercase tracking-wide">{label}</span>
      {showPulse && (
        <span className="ml-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
      )}
    </Button>
  );
}

export function FinanceHeaderActions({
  isAdmin,
  hasActiveAdvancedFilters,
  onOpenFilters,
  onOpenPaymentsReport,
  onOpenDaesReport,
  onOpenAudit,
  onOpenSettings,
}: FinanceHeaderActionsProps) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <HeaderActionButton
          label="Filtros"
          icon={SlidersHorizontal}
          onClick={onOpenFilters}
          showPulse={hasActiveAdvancedFilters}
        />
        <HeaderActionButton
          label="Pagamentos"
          icon={Receipt}
          onClick={onOpenPaymentsReport}
        />
        <HeaderActionButton
          label="DAEs"
          icon={FileSpreadsheet}
          onClick={onOpenDaesReport}
        />
      </div>

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <HeaderActionButton
            label="Auditoria"
            icon={History}
            onClick={onOpenAudit}
          />
          <HeaderActionButton
            label="Configurar"
            icon={SettingsIcon}
            onClick={onOpenSettings}
          />
        </div>
      )}
    </div>
  );
}
