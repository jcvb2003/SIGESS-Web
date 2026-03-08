import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import {
  DollarSign,
  AlertTriangle,
  FileText,
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
  readonly arrecadadoAno: number;
  readonly qtdPagamentosMes: number;
  readonly mesLabel: string;
  readonly yearLabel: string;
  readonly inadimplentes: number;
  readonly inadimplentes1Ano: number;
  readonly daePendente: number;
}

export function SummaryCards({
  arrecadadoMes,
  arrecadadoAno,
  qtdPagamentosMes,
  mesLabel,
  yearLabel,
  inadimplentes,
  inadimplentes1Ano,
  daePendente,
}: SummaryCardsProps) {
  const cards: StatCardConfig[] = [
    {
      title: "Arrecadado no Ano",
      value: formatCurrency(arrecadadoAno),
      description: `Total acumulado em ${yearLabel}`,
      icon: DollarSign,
      variant: "primary",
    },
    {
      title: "Arrecadado no Mês",
      value: formatCurrency(arrecadadoMes),
      description: `${qtdPagamentosMes} pagamentos em ${mesLabel}`,
      icon: DollarSign,
      variant: "info",
    },
    {
      title: "DAE - Boletos Pendentes",
      value: daePendente,
      description: "Recebido, aguardando pagamento",
      icon: FileText,
      variant: "warning",
    },
    {
      title: "Inadimplentes",
      value: inadimplentes,
      description: `${inadimplentes1Ano} há mais de 1 ano`,
      icon: AlertTriangle,
      variant: "destructive",
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
