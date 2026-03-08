import { cn } from "@/shared/lib/utils";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

interface ReapStatusBadgeProps {
  enviado: boolean;
  tem_problema: boolean;
  obs?: string | null;
  label?: string;
  className?: string;
}

export function ReapStatusBadge({
  enviado,
  tem_problema,
  obs,
  label,
  className,
}: Readonly<ReapStatusBadgeProps>) {
  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all",
        enviado && !tem_problema &&
          "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
        tem_problema &&
          "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
        !enviado && !tem_problema &&
          "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {enviado && !tem_problema && <CheckCircle2 className="h-2.5 w-2.5" />}
      {tem_problema && <AlertTriangle className="h-2.5 w-2.5" />}
      {!enviado && !tem_problema && <Clock className="h-2.5 w-2.5" />}
      {label}
    </span>
  );

  if (obs) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            {obs}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
