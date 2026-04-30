import React from "react";
import { cn } from "@/shared/lib/utils";
import { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

export type StatusBadgeVariant = 
  | "success" 
  | "warning" 
  | "destructive" 
  | "info" 
  | "secondary" 
  | "purple"
  | "orange"
  | "outline";

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  label: string | React.ReactNode;
  icon?: LucideIcon;
  tooltip?: string | null;
  className?: string;
  iconClassName?: string;
}

const variantStyles: Record<StatusBadgeVariant, string> = {
  success: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30",
  warning: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  destructive: "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive dark:border-destructive/30",
  info: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  secondary: "bg-muted text-muted-foreground border-border",
  purple: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  orange: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  outline: "bg-transparent border-border text-muted-foreground",
};

export function StatusBadge({
  variant,
  label,
  icon: Icon,
  tooltip,
  className,
  iconClassName,
}: Readonly<StatusBadgeProps>) {
  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap",
        variantStyles[variant],
        className
      )}
    >
      {Icon && <Icon className={cn("h-3 w-3 shrink-0", iconClassName)} />}
      <span>{label}</span>
    </span>
  );

  if (tooltip) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs font-medium">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
