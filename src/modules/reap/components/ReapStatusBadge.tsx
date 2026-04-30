import { StatusBadge, type StatusBadgeVariant } from "@/shared/components/ui/StatusBadge";
import { AlertTriangle, CheckCircle2, Clock, LucideIcon } from "lucide-react";

interface ReapStatusBadgeProps {
  enviado: boolean;
  tem_problema: boolean;
  obs?: string | null;
  label?: string;
  className?: string;
}

export function ReapStatusBadge({
  enviado,
  tem_problema,
  obs,
  label,
  className,
}: Readonly<ReapStatusBadgeProps>) {
  let variant: StatusBadgeVariant = "secondary";
  let icon: LucideIcon = Clock;

  if (enviado && !tem_problema) {
    variant = "success";
    icon = CheckCircle2;
  } else if (tem_problema) {
    variant = "warning";
    icon = AlertTriangle;
  }

  return (
    <StatusBadge
      variant={variant}
      icon={icon}
      label={label ?? (enviado ? "Enviado" : "Pendente")}
      tooltip={obs}
      className={className}
    />
  );
}
