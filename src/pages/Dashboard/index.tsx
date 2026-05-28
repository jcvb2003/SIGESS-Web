import {
  useDashboardStats,
  useRecentMembers,
  useBirthdayMembers,
} from "@/modules/dashboard/hooks/useDashboardData";
import { RecentMembersList } from "@/modules/dashboard/components/RecentMembersList";
import { BirthdayList } from "@/modules/dashboard/components/BirthdayList";
import { ActiveUnitBadge } from "@/modules/tenant-units/components/ActiveUnitBadge";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { StatCard } from "@/shared/components/ui/StatCard";
import { FileStack, User, Users } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentMembers, isLoading: recentLoading } = useRecentMembers();
  const { data: birthdayMembers, isLoading: birthdayLoading } =
    useBirthdayMembers();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Painel de Controle"
        description="Bem-vindo ao SIGESS. Visualize os principais indicadores e estatisticas da sua entidade em tempo real."
        actions={<ActiveUnitBadge />}
      />

      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Membros"
          value={stats?.totalMembers ?? 0}
          icon={Users}
          description="Socios cadastrados"
          loading={statsLoading}
          variant="primary"
        />
        <StatCard
          title="Homens"
          value={stats?.maleMembers ?? 0}
          icon={User}
          description="Socios do sexo masculino"
          loading={statsLoading}
          variant="info"
        />
        <StatCard
          title="Mulheres"
          value={stats?.femaleMembers ?? 0}
          icon={User}
          description="Socios do sexo feminino"
          loading={statsLoading}
          variant="accent"
        />
        <StatCard
          title="Documentos"
          value={stats?.totalDocuments ?? 0}
          icon={FileStack}
          description="Requerimentos gerados"
          loading={statsLoading}
          variant="info"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <RecentMembersList members={recentMembers} loading={recentLoading} />
        <BirthdayList members={birthdayMembers} loading={birthdayLoading} />
      </div>
    </div>
  );
}
