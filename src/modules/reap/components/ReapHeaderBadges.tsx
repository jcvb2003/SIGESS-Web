import { useReapDetail } from "@/modules/reap/hooks/data/useReapData";
import { calculateReapStatus, getApplicableYears, type ReapStatus } from "@/modules/reap/domain/reapDomain";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

function ReapBadge({
  label,
  status,
  detail,
}: {
  label: string;
  status: ReapStatus;
  detail: string;
}) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-default select-none",
              status === "ok" &&
                "bg-success/10 text-success border-success/20 dark:bg-success/10 dark:text-success dark:border-success/20",
              status === "problema" &&
                "bg-warning/10 text-warning border-warning/20 dark:bg-warning/10 dark:text-warning dark:border-warning/20",
              status === "parcial" &&
                "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800",
              status === "pendente" &&
                "bg-muted text-muted-foreground border-border"
            )}
          >
            {status === "ok" && <CheckCircle2 className="h-2 w-2" />}
            {status === "problema" && <AlertTriangle className="h-2 w-2" />}
            {(status === "pendente" || status === "parcial") && (
              <Clock className="h-2 w-2" />
            )}
            {label} {detail}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {label === "Simpl." ? "REAP Simplificado (2021–2024)" : "REAP Anual (2025+)"}
          {" · "}
          {status === "ok" && "Todos enviados"}
          {status === "parcial" && "Parcialmente enviados"}
          {status === "pendente" && "Nenhum enviado"}
          {status === "problema" && "Com problema registrado"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ReapHeaderBadgesProps {
  cpf: string | null;
  emissaoRgp?: string | null;
}

export function ReapHeaderBadges({
  cpf,
  emissaoRgp,
}: Readonly<ReapHeaderBadgesProps>) {
  const { reap, isLoading } = useReapDetail(cpf);

  if (!cpf || isLoading) return null;

  // --- Simplificado ---
  const anosSimplificado = getApplicableYears(emissaoRgp, "simplificado");
  const simplificadoEnviados = anosSimplificado.filter(
    (a) => reap?.simplificado?.[String(a)]?.enviado
  ).length;
  const simplificadoProblema = anosSimplificado.some(
    (a) => reap?.simplificado?.[String(a)]?.tem_problema
  );

  const simplificadoStatus = calculateReapStatus(
    simplificadoEnviados,
    anosSimplificado.length,
    simplificadoProblema,
  );

  // --- Anual (2025+) ---
  const anosAnual = getApplicableYears(emissaoRgp, "anual");

  const anualEnviados = anosAnual.filter(
    (a) => reap?.anual?.[String(a)]?.enviado
  ).length;
  const anualProblema = anosAnual.some(
    (a) => reap?.anual?.[String(a)]?.tem_problema
  );

  const anualStatus = calculateReapStatus(
    anualEnviados,
    anosAnual.length,
    anualProblema,
  );

  return (
    <>
      <ReapBadge
        label="Simpl."
        status={simplificadoStatus}
        detail={`${simplificadoEnviados}/${anosSimplificado.length}`}
      />
      {anosAnual.length > 0 && (
        <ReapBadge
          label="REAP 25"
          status={anualStatus}
          detail={`${anualEnviados}/${anosAnual.length}`}
        />
      )}
    </>
  );
}
