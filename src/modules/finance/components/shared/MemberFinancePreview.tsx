import { useMemo } from "react";
import type { ReactNode } from "react";
import { FinancialStatusBadge } from "./FinancialStatusBadge";
import type { FinancialStatusType } from "../../types/finance.types";

interface MemberFinancePreviewProps {
  readonly name?: string;
  readonly cpf?: string;
  readonly status?: FinancialStatusType;
  readonly regime?: string;
  readonly children?: ReactNode;
}

/**
 * Preview do sócio exibido nos diálogos/modais financeiros.
 * Renderiza avatar com iniciais, nome, CPF e opcionalmente status e regime.
 */
export function MemberFinancePreview({
  name,
  cpf,
  status,
  regime,
  children,
}: MemberFinancePreviewProps) {
  const initials = useMemo(() => {
    return name
      ?.split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [name]);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-emerald-50/50 border border-emerald-100 p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-sm ring-2 ring-emerald-100 ring-offset-1">
        {initials ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 leading-tight">
          {name ?? "—"}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-emerald-600 font-medium truncate">
            CPF: {cpf}
          </span>
          {regime && (
            <>
              <span className="text-[10px] text-emerald-300">|</span>
              <span className="text-xs text-emerald-700/90 font-medium">
                {regime}
              </span>
            </>
          )}
          {status && (
            <>
              <span className="text-[10px] text-emerald-300">|</span>
              <FinancialStatusBadge
                status={status}
                className="h-4.5 px-1.5 text-[9px] uppercase tracking-wider"
              />
            </>
          )}
        </div>
      </div>
      {children && (
        <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0 max-w-[200px]">
          {children}
        </div>
      )}
    </div>
  );
}
