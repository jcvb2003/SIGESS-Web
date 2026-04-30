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
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
            {label}
          </span>
          {subValue && (
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
              {subValue}
            </span>
          )}
        </div>
      </div>
      <div className={cn("text-sm font-bold text-foreground", valueClassName)}>
        {value}
      </div>
    </div>
  );
}
