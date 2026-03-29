import type { MemberFinancialSummary } from "../../../types/finance.types";
import { cn } from "@/shared/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

interface AnnuitiesCellProps {
  readonly member: MemberFinancialSummary;
  readonly currentYear: number;
  readonly anoBase: number;
}

export function AnnuitiesCell({ member, currentYear, anoBase }: AnnuitiesCellProps) {
  if (member.isento) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 border border-blue-100">
        Isento
      </span>
    );
  }

  if (member.regime === "mensalidade") {
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
        Mensalista
      </span>
    );
  }

  const paid = member.anuidadesPagas ?? [];
  const years: { year: number; isPaid: boolean }[] = [];

  for (let y = anoBase; y <= currentYear; y++) {
    years.push({ year: y, isPaid: paid.includes(y) });
  }

  // Show only the last 3 years for compact display
  const displayYears = years.slice(-3);

  return (
    <div className="flex items-center gap-1.5">
      <TooltipProvider>
        {displayYears.map((y) => (
          <Tooltip key={y.year}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold border transition-all cursor-default shadow-sm",
                  y.isPaid 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                    : "bg-red-50 border-red-100 text-red-600 opacity-60 hover:opacity-100"
                )}
              >
                {String(y.year).slice(-2)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] px-2 py-1">
              Anuidade {y.year}: {y.isPaid ? "Paga ✓" : "Pendente ✗"}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
