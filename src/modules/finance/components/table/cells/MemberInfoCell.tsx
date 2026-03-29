import { cn } from "@/shared/lib/utils";
import type { FinancialStatusType } from "../../../types/finance.types";

interface MemberInfoCellProps {
  readonly nome: string;
  readonly status?: FinancialStatusType;
}

const STATUS_DOT_COLORS: Record<FinancialStatusType, string> = {
  ok: "bg-emerald-500",
  overdue: "bg-red-500",
  exempt: "bg-blue-500",
  released: "bg-amber-500",
  alert: "bg-orange-500",
};

const STATUS_AVATAR_COLORS: Record<FinancialStatusType, string> = {
  ok: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  exempt: "bg-blue-100 text-blue-700",
  released: "bg-amber-100 text-amber-700",
  alert: "bg-orange-100 text-orange-700",
};

/**
 * Capitaliza nomes corretamente (ex: JOSÉ DA SILVA -> José da Silva)
 */
function capitalizeName(name: string): string {
  if (!name) return "";
  const words = name.toLowerCase().split(" ");
  const lowers = new Set(["de", "da", "do", "das", "dos", "e"]);
  return words
    .map((word, index) => {
      if (word.length === 0) return "";
      if (index > 0 && lowers.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function MemberInfoCell({ nome, status = "ok" }: MemberInfoCellProps) {
  const initials = nome
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold shadow-sm ring-2 ring-white",
            STATUS_AVATAR_COLORS[status],
          )}
        >
          {initials}
        </div>
        <span 
          className={cn(
            "absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full border-2 border-white shadow-sm",
            STATUS_DOT_COLORS[status]
          )}
        />
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-sm font-medium text-slate-900 leading-tight">
          {capitalizeName(nome)}
        </span>
      </div>
    </div>
  );
}
