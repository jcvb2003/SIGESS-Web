import { useDashboardStats, useRecentMembers, useBirthdayMembers } from '@/modules/dashboard/hooks/useDashboardData'
import { StatCard } from '@/modules/dashboard/components/StatCard'
import { RecentMembersList } from '@/modules/dashboard/components/RecentMembersList'
import { BirthdayList } from '@/modules/dashboard/components/BirthdayList'
import { Users, User, UserPlus, FileText } from 'lucide-react'

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: recentMembers, isLoading: recentLoading } = useRecentMembers()
  const { data: birthdayMembers, isLoading: birthdayLoading } = useBirthdayMembers()

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">


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
          variant="secondary"
        />
        <StatCard
          title="Mulheres"
          value={stats?.femaleMembers ?? 0}
          icon={UserPlus}
          description="Sócios do sexo feminino"
          loading={statsLoading}
          variant="accent"
        />
        <StatCard
          title="Documentos"
          value={stats?.totalDocuments ?? 0}
          icon={FileText}
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
  )
}
