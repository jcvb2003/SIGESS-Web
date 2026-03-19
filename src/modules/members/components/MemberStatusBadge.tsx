import { cn } from "@/shared/lib/utils";
import {
  CheckCircle,
  UserX,
  ArrowRightLeft,
  Ban,
  Pause,
  XCircle,
  ShieldCheck,
} from "lucide-react";
interface MemberStatusBadgeProps {
  status: string | null;
  className?: string;
}
function getStatusInfo(status: string | null) {
  if (!status) {
    return {
      icon: XCircle,
      label: "Desconhecido",
      textColor: "text-gray-500 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-800/50",
    };
  }
  const normalized = status.toUpperCase();
  if (normalized.includes("ATIVO") && !normalized.includes("INATIVO")) {
    return {
      icon: CheckCircle,
      label: "Ativo",
      textColor: "text-emerald-700 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    };
  }
  if (normalized.includes("APOSENTADO")) {
    return {
      icon: ShieldCheck,
      label: "Aposentado",
      textColor: "text-blue-700 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
    };
  }
  if (normalized.includes("FALECIDO")) {
    return {
      icon: UserX,
      label: "Falecido",
      textColor: "text-gray-700 dark:text-gray-300",
      bgColor: "bg-gray-100 dark:bg-gray-800/50",
    };
  }
  if (normalized.includes("TRANSFERIDO")) {
    return {
      icon: ArrowRightLeft,
      label: "Transferido",
      textColor: "text-orange-700 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/40",
    };
  }
  if (normalized.includes("CANCELADO")) {
    return {
      icon: Ban,
      label: "Cancelado",
      textColor: "text-red-700 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/40",
    };
  }
  if (normalized.includes("SUSPENSO")) {
    return {
      icon: Pause,
      label: "Suspenso",
      textColor: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
    };
  }
  return {
    icon: XCircle,
    label: status || "Desconhecido",
    textColor: "text-gray-500 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800/50",
  };
}
export function MemberStatusBadge({
  status,
  className,
}: Readonly<MemberStatusBadgeProps>) {
  const { icon: Icon, label, textColor, bgColor } = getStatusInfo(status);
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide",
        bgColor,
        textColor,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </div>
  );
}
