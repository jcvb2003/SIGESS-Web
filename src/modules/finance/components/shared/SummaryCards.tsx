import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import {
  DollarSign,
  AlertTriangle,
  FileText,
  Unlock,
  LucideIcon,
} from "lucide-react";
import { StatCard, StatCardVariant } from "@/modules/dashboard/components/StatCard";

interface StatCardConfig {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  variant: StatCardVariant;
}

interface SummaryCardsProps {
  readonly arrecadadoMes: number;
  readonly qtdPagamentosMes: number;
  readonly mesLabel: string;
  readonly inadimplentes: number;
  readonly inadimplentes1Ano: number;
  readonly daePendente: number;
  readonly liberados: number;
  readonly isentos: number;
}

export function SummaryCards({
  arrecadadoMes,
  qtdPagamentosMes,
  mesLabel,
  inadimplentes,
  inadimplentes1Ano,
  daePendente,
  liberados,
  isentos,
}: SummaryCardsProps) {
  const cards: StatCardConfig[] = [
    {
      title: "Arrecadado no Mês",
      value: formatCurrency(arrecadadoMes),
      description: `${qtdPagamentosMes} pagamentos em ${mesLabel}`,
      icon: DollarSign,
      variant: "primary",
    },
    {
      title: "Inadimplentes",
      value: inadimplentes,
      description: `${inadimplentes1Ano} há mais de 1 ano`,
      icon: AlertTriangle,
      variant: "secondary",
    },
    {
      title: "DAE — Boleto Pendente",
      value: daePendente,
      description: "Recebido, aguardando pagamento",
      icon: FileText,
      variant: "info",
    },
    {
      title: "Liberados / Isentos",
      value: liberados + isentos,
      description: `${liberados} liberados · ${isentos} isentos`,
      icon: Unlock,
      variant: "accent",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          description={card.description}
          icon={card.icon}
          variant={card.variant}
        />
      ))}
    </div>
  );
}
