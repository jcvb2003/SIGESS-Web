import { Badge } from "@/shared/components/ui/badge";
import { RequirementStatus } from "../types/requirement.types";
import { cn } from "@/shared/lib/utils";

interface StatusBadgeProps {
  status: RequirementStatus;
  className?: string;
}

const statusConfig: Record<RequirementStatus, { label: string; className: string }> = {
  assinado: { 
    label: "Assinado", 
    className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" 
  },
  analise: { 
    label: "Em Análise", 
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" 
  },
  recurso_acerto: { 
    label: "Recurso / Acerto", 
    className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" 
  },
  deferido: { 
    label: "Deferido", 
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" 
  },
  indeferido: { 
    label: "Indeferido", 
    className: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800" 
  },
};

export function StatusBadge({ status, className }: Readonly<StatusBadgeProps>) {
  const config = statusConfig[status];
  
  return (
    <Badge variant="outline" className={cn("font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
}
