import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Label de seção — uppercase, tracking-wide, muted. Usado em cards de detalhe.
 */
export function SectionLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5",
        className,
      )}
      {...props}
    />
  );
}
