import { StatusBadge, type StatusBadgeVariant } from "@/shared/components/ui/StatusBadge";
import { RequirementStatus } from "../types/requirement.types";

interface StatusBadgeProps {
  status: RequirementStatus;
  className?: string;
}

const statusConfig: Record<RequirementStatus, { label: string; variant: StatusBadgeVariant }> = {
  assinado: { 
    label: "Assinado", 
    variant: "info"
  },
  analise: { 
    label: "Em Análise", 
    variant: "warning"
  },
  recurso_acerto: { 
    label: "Recurso / Acerto", 
    variant: "purple"
  },
  deferido: { 
    label: "Deferido", 
    variant: "success"
  },
  indeferido: { 
    label: "Indeferido", 
    variant: "destructive"
  },
  nao_assinado: {
    label: "Não Assinou",
    variant: "outline"
  },
};

export function RequirementStatusBadge({ status, className }: Readonly<StatusBadgeProps>) {
  const config = statusConfig[status];
  
  return (
    <StatusBadge 
      variant={config.variant} 
      label={config.label} 
      className={className} 
    />
  );
}
