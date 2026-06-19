import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useOnlineUsers } from "../hooks/useOnlineUsers";

function lastSeenLabel(lastSeenAt: string | null): string {
  if (!lastSeenAt) return "sem atividade recente";

  const diff = Date.now() - new Date(lastSeenAt).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours}h`;
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

function routeLabel(route: string | null): string {
  if (!route) return "";
  const map: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/members": "Sócios",
    "/finance": "Financeiro",
    "/documents": "Documentos",
    "/reap": "REAP",
    "/reports": "Relatórios",
    "/requirements": "Requerimentos",
    "/settings": "Configurações",
  };
  const key = Object.keys(map).find((k) => route.startsWith(k));
  return key ? map[key] : route;
}

export function OnlineUsersCard() {
  const { data: users, isLoading } = useOnlineUsers();

  const onlineCount = users?.filter((u) => u.isOnline).length ?? 0;

  return (
    <Card className="col-span-1 h-full shadow-sm hover:shadow-md transition-all duration-300 border-none bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 shrink-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </div>
          Equipe
          {onlineCount > 0 && (
            <span className="ml-1 flex items-center gap-1 text-xs font-medium text-success">
              <span className="h-2 w-2 rounded-full bg-success" />
              {onlineCount} online
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6 space-y-4 flex-1 overflow-hidden">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !users || users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 px-4">
            <div className="p-3 rounded-full bg-muted/30">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhum usuário disponível.
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
            {users.map((u) => {
              const initial = (u.user_name ?? "?").charAt(0).toUpperCase();
              const subtitle = u.isOnline
                ? routeLabel(u.current_route) || "Online"
                : u.last_seen_at
                  ? `Visto ${lastSeenLabel(u.last_seen_at)}`
                  : "Ainda sem atividade";

              return (
                <div
                  key={u.user_id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all duration-200 group cursor-pointer border border-transparent hover:border-primary/10"
                >
                  <div className="relative shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold border-2 border-background shadow-sm group-hover:border-primary/20 transition-colors">
                      {initial}
                    </div>
                    {u.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-background" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-none truncate text-foreground group-hover:text-primary transition-colors">
                      {u.user_name ?? "Usuário"}
                      {u.isSelf ? " (você)" : ""}
                    </p>
                    <p className={`text-xs truncate mt-1.5 flex items-center gap-1 ${u.isOnline ? "text-success" : "text-muted-foreground"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${u.isOnline ? "bg-success" : "bg-muted-foreground/40"}`} />
                      {subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
