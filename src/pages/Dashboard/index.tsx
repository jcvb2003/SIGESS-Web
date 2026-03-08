import {
  useDashboardStats,
  useRecentMembers,
  useBirthdayMembers,
} from "@/modules/dashboard/hooks/useDashboardData";
import { StatCard } from "@/modules/dashboard/components/StatCard";
import { RecentMembersList } from "@/modules/dashboard/components/RecentMembersList";
import { BirthdayList } from "@/modules/dashboard/components/BirthdayList";
import { Users, User, FileStack } from "lucide-react";
import { PageHeader } from "@/shared/components/layout/PageHeader";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentMembers, isLoading: recentLoading } = useRecentMembers();
  const { data: birthdayMembers, isLoading: birthdayLoading } =
    useBirthdayMembers();
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Painel de Controle"
        description="Bem-vindo ao SIGESS. Visualize os principais indicadores e estatísticas da sua entidade em tempo real."
      />
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Membros"
          value={stats?.totalMembers ?? 0}
          icon={Users}
          description="Sócios cadastrados"
          loading={statsLoading}
          variant="primary"
        />
        <StatCard
          title="Homens"
          value={stats?.maleMembers ?? 0}
          icon={User}
          description="Sócios do sexo masculino"
          loading={statsLoading}
          variant="info"
        />
        <StatCard
          title="Mulheres"
          value={stats?.femaleMembers ?? 0}
          icon={User}
          description="Sócios do sexo feminino"
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
