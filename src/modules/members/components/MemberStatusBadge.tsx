import { StatusBadge, type StatusBadgeVariant } from "@/shared/components/ui/StatusBadge";
import {
  CheckCircle,
  UserX,
  ArrowRightLeft,
  Ban,
  Pause,
  XCircle,
  ShieldCheck,
  CircleOff,
  LucideIcon,
} from "lucide-react";

interface MemberStatusBadgeProps {
  status: string | null;
  className?: string;
}

interface StatusConfig {
  variant: StatusBadgeVariant;
  icon: LucideIcon;
  label: string;
}

function getStatusConfig(status: string | null): StatusConfig {
  if (!status) {
    return {
      variant: "secondary",
      icon: XCircle,
      label: "—",
    };
  }

  const normalized = status.toUpperCase();

  if (normalized.includes("ATIVO") && !normalized.includes("INATIVO")) {
    return {
      variant: "success",
      icon: CheckCircle,
      label: "Ativo",
    };
  }
  if (normalized.includes("INATIVO")) {
    return {
      variant: "secondary",
      icon: CircleOff,
      label: "Inativo",
    };
  }
  if (normalized.includes("APOSENTADO")) {
    return {
      variant: "info",
      icon: ShieldCheck,
      label: "Aposentado",
    };
  }
  if (normalized.includes("FALECIDO")) {
    return {
      variant: "secondary",
      icon: UserX,
      label: "Falecido",
    };
  }
  if (normalized.includes("TRANSFERIDO")) {
    return {
      variant: "warning",
      icon: ArrowRightLeft,
      label: "Transferido",
    };
  }
  if (normalized.includes("CANCELADO")) {
    return {
      variant: "destructive",
      icon: Ban,
      label: "Cancelado",
    };
  }
  if (normalized.includes("SUSPENSO")) {
    return {
      variant: "warning",
      icon: Pause,
      label: "Suspenso",
    };
  }

  return {
    variant: "secondary",
    icon: XCircle,
    label: status || "Desconhecido",
  };
}

export function MemberStatusBadge({
  status,
  className,
}: Readonly<MemberStatusBadgeProps>) {
  const { variant, icon, label } = getStatusConfig(status);

  return (
    <StatusBadge
      variant={variant}
      icon={icon}
      label={label}
      className={className}
    />
  );
}
