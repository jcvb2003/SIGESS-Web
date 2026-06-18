import type { LucideIcon } from "lucide-react";
import {
  CheckCircle,
  CircleOff,
  ShieldCheck,
  UserX,
  ArrowRightLeft,
  Ban,
  Pause,
  XCircle,
} from "lucide-react";
import type { StatusBadgeVariant } from "@/shared/components/ui/StatusBadge";

export interface SituacaoDisplayConfig {
  variant: StatusBadgeVariant;
  icon: LucideIcon;
  label: string;
}

/** Lista canônica de situações — única fonte para formulários e filtros. */
export const SITUACAO_OPTIONS = [
  { value: "ATIVO", label: "Ativo" },
  { value: "INATIVO", label: "Inativo" },
  { value: "APOSENTADO", label: "Aposentado" },
  { value: "FALECIDO", label: "Falecido" },
  { value: "TRANSFERIDO", label: "Transferido" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "SUSPENSO", label: "Suspenso" },
] as const;

/** Mapa de display por situação — única fonte para o badge de status. */
export const SITUACAO_DISPLAY: Record<string, SituacaoDisplayConfig> = {
  ATIVO: { variant: "success", icon: CheckCircle, label: "Ativo" },
  INATIVO: { variant: "secondary", icon: CircleOff, label: "Inativo" },
  APOSENTADO: { variant: "info", icon: ShieldCheck, label: "Aposentado" },
  FALECIDO: { variant: "secondary", icon: UserX, label: "Falecido" },
  TRANSFERIDO: { variant: "warning", icon: ArrowRightLeft, label: "Transferido" },
  CANCELADO: { variant: "destructive", icon: Ban, label: "Cancelado" },
  SUSPENSO: { variant: "warning", icon: Pause, label: "Suspenso" },
};

/** Fallback para situações desconhecidas. */
export const SITUACAO_FALLBACK: SituacaoDisplayConfig = {
  variant: "secondary",
  icon: XCircle,
  label: "Desconhecido",
};

/**
 * Classes Tailwind para contexto de impressão — usa cores fixas em vez de
 * CSS variables porque variáveis não são confiáveis em print media.
 */
export const SITUACAO_PRINT: Record<string, { bg: string; text: string }> = {
  ATIVO: { bg: "bg-green-600 text-white", text: "text-green-700" },
  INATIVO: { bg: "bg-slate-500 text-white", text: "text-slate-600" },
  APOSENTADO: { bg: "bg-sky-500 text-white", text: "text-sky-700" },
  FALECIDO: { bg: "bg-slate-400 text-white", text: "text-slate-500" },
  TRANSFERIDO: { bg: "bg-amber-500 text-white", text: "text-amber-700" },
  CANCELADO: { bg: "bg-red-500 text-white", text: "text-red-700" },
  SUSPENSO: { bg: "bg-amber-500 text-white", text: "text-amber-700" },
};

export const SITUACAO_PRINT_FALLBACK = { bg: "bg-slate-400 text-white", text: "text-foreground" };
