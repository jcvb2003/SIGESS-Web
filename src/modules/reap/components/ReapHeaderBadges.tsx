import { useReapDetail } from "@/modules/reap/hooks/data/useReapData";
import {
  ANOS_SIMPLIFICADO,
  ANO_INICIAL_ANUAL,
  ANO_ATUAL,
} from "@/modules/reap/types/reap.types";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

type ReapStatus = "ok" | "parcial" | "pendente" | "problema";

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
                "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
              status === "problema" &&
                "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
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

  const anoRgp = emissaoRgp ? new Date(emissaoRgp).getFullYear() : null;

  // --- Simplificado ---
  const anosSimplificado = ANOS_SIMPLIFICADO.filter(
    (a) => !anoRgp || a >= anoRgp
  );
  const simplificadoEnviados = anosSimplificado.filter(
    (a) => reap?.simplificado?.[String(a)]?.enviado
  ).length;
  const simplificadoProblema = anosSimplificado.some(
    (a) => reap?.simplificado?.[String(a)]?.tem_problema
  );

  let simplificadoStatus: ReapStatus = "pendente";
  if (simplificadoProblema) simplificadoStatus = "problema";
  else if (
    anosSimplificado.length > 0 &&
    simplificadoEnviados === anosSimplificado.length
  )
    simplificadoStatus = "ok";
  else if (simplificadoEnviados > 0) simplificadoStatus = "parcial";

  // --- Anual (2025+) ---
  const anoInicioAnual = anoRgp
    ? Math.max(anoRgp, ANO_INICIAL_ANUAL)
    : ANO_INICIAL_ANUAL;
  const anosAnual: number[] = [];
  for (let a = anoInicioAnual; a <= ANO_ATUAL - 1; a++) anosAnual.push(a);

  const anualEnviados = anosAnual.filter(
    (a) => reap?.anual?.[String(a)]?.enviado
  ).length;
  const anualProblema = anosAnual.some(
    (a) => reap?.anual?.[String(a)]?.tem_problema
  );

  let anualStatus: ReapStatus = "pendente";
  if (anualProblema) anualStatus = "problema";
  else if (anosAnual.length > 0 && anualEnviados === anosAnual.length)
    anualStatus = "ok";
  else if (anualEnviados > 0) anualStatus = "parcial";

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
