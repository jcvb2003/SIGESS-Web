import { cn } from "@/shared/lib/utils";
import type { GovBatchStatusItem } from "@/shared/utils/browserDetection";
import { getStatusStepIndex, getStatusStepTotal } from "../utils/govBatchStatus";

interface GovBatchTrackProps {
  readonly statusItem?: GovBatchStatusItem;
}

export function GovBatchTrack({ statusItem }: Readonly<GovBatchTrackProps>) {
  const totalSteps = getStatusStepTotal(statusItem);
  const currentStep = getStatusStepIndex(statusItem, totalSteps);
  const status = statusItem?.status;

  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const filled = index < currentStep;
        const errored = status === "erro" && index === currentStep - 1;

        return (
          <span
            key={`gov-track-${index}`}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              filled ? "bg-primary" : "bg-muted",
              errored && "bg-destructive",
            )}
          />
        );
      })}
    </div>
  );
}
