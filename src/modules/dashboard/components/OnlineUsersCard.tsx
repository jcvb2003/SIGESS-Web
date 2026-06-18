import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useOnlineUsers } from "../hooks/useOnlineUsers";

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

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <div className="relative">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success border border-background" />
          </div>
          Online agora
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : !users || users.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1">
            Nenhum outro usuário online.
          </p>
        ) : (
          <ul className="space-y-2">
            {users.map((u) => {
              const initial = (u.user_name ?? "?").charAt(0).toUpperCase();
              const label = routeLabel(u.current_route);
              return (
                <li key={u.user_id} className="flex items-center gap-2.5">
                  <div className="relative shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {initial}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-background" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {u.user_name ?? "Usuário"}
                    </p>
                    {label && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {label}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
