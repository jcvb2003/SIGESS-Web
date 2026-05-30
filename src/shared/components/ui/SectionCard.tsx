import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";

/**
 * Card padrão para seções do portal — borda sutil, sombra leve.
 */
export function SectionCard({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Card>) {
  return (
    <Card className={cn("border-border/50 shadow-sm", className)} {...props} />
  );
}

/**
 * CardHeader com layout de linha para título + botão de ação.
 */
export function SectionCardHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CardHeader>) {
  return (
    <CardHeader
      className={cn("flex flex-row items-center justify-between gap-4", className)}
      {...props}
    />
  );
}

/**
 * CardContent para tabelas full-bleed — sem padding horizontal, borda superior sutil.
 * Scroll horizontal automático em mobile.
 */
export function SectionCardTableContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CardContent>) {
  return (
    <CardContent
      className={cn("border-t border-border/10 pt-0 px-0", className)}
      {...props}
    >
      <div className="overflow-x-auto">{children}</div>
    </CardContent>
  );
}
