import {
  useDashboardStats,
  useRecentMembers,
  useBirthdayMembers,
} from "@/modules/dashboard/hooks/useDashboardData";
import { RecentMembersList } from "@/modules/dashboard/components/RecentMembersList";
import { BirthdayList } from "@/modules/dashboard/components/BirthdayList";
import { OnlineUsersCard } from "@/modules/dashboard/components/OnlineUsersCard";
import { ActiveUnitBadge } from "@/modules/tenant-units/components/ActiveUnitBadge";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { FileStack, User, Users, Bell } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { LucideIcon } from "lucide-react";

// ─── StatStrip ────────────────────────────────────────────────────────────────

interface StatItem {
  title: string;
  value: number;
  icon: LucideIcon;
  iconClass: string;
  valueClass: string;
}

function StatStrip({ items, loading }: { items: StatItem[]; loading: boolean }) {
  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <div className="flex divide-x divide-border/50">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="flex-1 flex items-center gap-3 px-5 py-4 min-w-0"
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", item.iconClass)}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                {loading ? (
                  <>
                    <Skeleton className="h-6 w-12 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </>
                ) : (
                  <>
                    <p className={cn("text-xl font-bold leading-none", item.valueClass)}>
                      {item.value.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {item.title}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentMembers, isLoading: recentLoading } = useRecentMembers();
  const { data: birthdayMembers, isLoading: birthdayLoading } = useBirthdayMembers();

  const statItems: StatItem[] = [
    {
      title: "Total de Sócios",
      value: stats?.totalMembers ?? 0,
      icon: Users,
      iconClass: "bg-primary/10 text-primary",
      valueClass: "text-primary",
    },
    {
      title: "Homens",
      value: stats?.maleMembers ?? 0,
      icon: User,
      iconClass: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]",
      valueClass: "text-[hsl(var(--info))]",
    },
    {
      title: "Mulheres",
      value: stats?.femaleMembers ?? 0,
      icon: User,
      iconClass: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
      valueClass: "text-[hsl(var(--warning))]",
    },
    {
      title: "Documentos",
      value: stats?.totalDocuments ?? 0,
      icon: FileStack,
      iconClass: "bg-muted text-muted-foreground",
      valueClass: "text-foreground",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Painel de Controle"
        description="Bem-vindo ao SIGESS. Visualize os principais indicadores e estatísticas da sua entidade."
        actions={<ActiveUnitBadge />}
      />

      {/* Stat strip */}
      <StatStrip items={statItems} loading={statsLoading} />

      {/* Online + Lembretes */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <OnlineUsersCard />

        <Card className="border-border/50 shadow-sm border-dashed opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              Lembretes e anotações
              <Badge variant="outline" className="ml-auto text-[10px] font-normal text-muted-foreground">
                Em breve
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Lembretes pessoais e anotações rápidas aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Membros recentes + Aniversariantes */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <RecentMembersList members={recentMembers} loading={recentLoading} />
        <BirthdayList members={birthdayMembers} loading={birthdayLoading} />
      </div>
    </div>
  );
}
