import { cn } from "@/shared/lib/utils";
import type { GovBatchStatusItem } from "@/shared/utils/browserDetection";
import { GovBatchTrack } from "./GovBatchTrack";
import { BoletoInfoDisplay } from "./BoletoInfoDisplay";
import {
  resolveStatusHeading,
  statusTextClassName,
} from "../utils/govBatchStatus";

interface GovStatusSectionProps {
  readonly statusItem?: GovBatchStatusItem;
}

export function GovStatusSection({
  statusItem,
}: Readonly<GovStatusSectionProps>) {
  if (!statusItem) {
    return (
      <div className="mt-1 space-y-1.5">
        <GovBatchTrack />
        <p className="text-xs text-muted-foreground">
          Aguardando envio para a extensão
        </p>
      </div>
    );
  }

  return (
    <div className="mt-1 space-y-1.5">
      <GovBatchTrack statusItem={statusItem} />
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.14em]",
            statusTextClassName(statusItem.status),
          )}
        >
          {resolveStatusHeading(statusItem)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {statusItem.statusDescription ||
          "A extensão atualizou o progresso desta sessão."}
      </p>
      <BoletoInfoDisplay statusItem={statusItem} />
      {statusItem.status === "erro" && statusItem.lastError && (
        <p className="text-xs text-destructive">{statusItem.lastError}</p>
      )}
    </div>
  );
}
