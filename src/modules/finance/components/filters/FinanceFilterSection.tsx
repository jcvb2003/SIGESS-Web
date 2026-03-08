import type { ReactNode } from "react";

interface FinanceFilterSectionProps {
  title: string;
  children: ReactNode;
}

export function FinanceFilterSection({
  title,
  children,
}: Readonly<FinanceFilterSectionProps>) {
  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase">
        {title}
      </span>
      {children}
    </div>
  );
}
