import { cn } from "@/shared/lib/utils";

interface StatementRowProps {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly subValue?: string;
  readonly icon?: React.ReactNode;
  readonly className?: string;
  readonly valueClassName?: string;
}

export function StatementRow({
  label,
  value,
  subValue,
  icon,
  className,
  valueClassName,
}: StatementRowProps) {
  return (
    <div className={cn("flex items-center justify-between py-3 border-b border-slate-50 last:border-0", className)}>
      <div className="flex items-center gap-3">
        {icon && <div className="text-slate-400">{icon}</div>}
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
            {label}
          </span>
          {subValue && (
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
              {subValue}
            </span>
          )}
        </div>
      </div>
      <div className={cn("text-sm font-bold text-slate-700", valueClassName)}>
        {value}
      </div>
    </div>
  );
}
