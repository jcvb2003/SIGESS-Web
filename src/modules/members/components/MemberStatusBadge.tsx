import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { XCircle } from "lucide-react";
import { SITUACAO_DISPLAY } from "../constants/memberStatus";

interface MemberStatusBadgeProps {
  status: string | null;
  className?: string;
}

export function MemberStatusBadge({
  status,
  className,
}: Readonly<MemberStatusBadgeProps>) {
  const config = status
    ? (SITUACAO_DISPLAY[status.toUpperCase().trim()] ?? {
        variant: "secondary" as const,
        icon: XCircle,
        label: status,
      })
    : { variant: "secondary" as const, icon: XCircle, label: "—" };

  return (
    <StatusBadge
      variant={config.variant}
      icon={config.icon}
      label={config.label}
      className={className}
    />
  );
}
