import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Files,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  Menu,
  Fish,
  Sun,
  Moon,
  Wallet,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { FeatureRestrictedModal } from "./FeatureRestrictedModal";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { useMobile } from "@/shared/hooks/useMobile";
const NAV_ITEMS = [
  { title: "Início", href: "/dashboard", icon: LayoutDashboard },
  { title: "Sócios", href: "/members", icon: Users },
  { title: "Cadastro", href: "/registration", icon: UserPlus },
  { title: "Documentos", href: "/documents", icon: Files },
  { title: "Financeiro", href: "/finance", icon: Wallet },
  { title: "Relatórios", href: "/reports", icon: ChartNoAxesCombined },
  { title: "Configurações", href: "/settings", icon: Settings, adminOnly: true },
];
type SidebarContentProps = {
  isCollapsed: boolean;
  pathname: string;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  onNavigate: () => void;
  onSignOut: () => void;
};
function SidebarContent({
  isCollapsed,
  pathname,
  theme,
  setTheme,
  onNavigate,
  onSignOut,
}: SidebarContentProps) {
  const { isAdmin } = usePermissions();
  const [restrictedModalOpen, setRestrictedModalOpen] = useState(false);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out overflow-hidden">
      <FeatureRestrictedModal 
        open={restrictedModalOpen} 
        onOpenChange={setRestrictedModalOpen} 
      />
      <div
        className={cn(
          "flex h-20 items-center px-4 transition-all duration-300 shrink-0",
          isCollapsed && "justify-center",
        )}
      >
        <Link
          to="/dashboard"
          className="flex items-center gap-3 group overflow-hidden"
        >
          <div className="flex h-10 w-10 min-w-[2.5rem] items-center justify-center rounded-xl bg-primary-foreground/20 dark:bg-white/10 text-sidebar-foreground transition-all group-hover:bg-primary-foreground group-hover:text-primary dark:group-hover:bg-primary dark:group-hover:text-white shadow-sm">
            <Fish className="h-6 w-6" />
          </div>
          <div
            className={cn(
              "flex flex-col transition-opacity duration-300",
              isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto",
            )}
          >
            <span className="font-bold text-xl tracking-tight leading-none text-sidebar-foreground whitespace-nowrap">
              SIGESS
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 scrollbar-none">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item, index) => {
            const isRestricted = item.adminOnly && !isAdmin;
            const isActive =
              !isRestricted && (
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`))
              );

            const handleItemClick = (e: React.MouseEvent) => {
              if (isRestricted) {
                e.preventDefault();
                setRestrictedModalOpen(true);
              } else {
                onNavigate();
              }
            };

            const LinkContent = (
              <Link
                to={isRestricted ? "#" : item.href}
                onClick={handleItemClick}
                className={cn(
                  "flex items-center rounded-xl py-3 text-sm font-semibold transition-all whitespace-nowrap relative overflow-hidden group my-1",
                  isCollapsed ? "justify-center px-0 gap-0 w-10 mx-auto" : "justify-start px-3 gap-3 mx-1",
                  isActive
                    ? "bg-background text-primary shadow-md dark:bg-primary/15 dark:text-primary dark:shadow-primary/10"
                    : isRestricted
                    ? "opacity-40 grayscale cursor-not-allowed pointer-events-auto"
                    : "text-sidebar-foreground/80 hover:bg-primary-foreground/20 hover:text-sidebar-foreground dark:hover:bg-white/10 dark:hover:text-white",
                )}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
                    !isRestricted && "group-hover:scale-110",
                    isActive
                      ? "text-primary"
                      : "text-sidebar-foreground/80 group-hover:text-sidebar-foreground",
                  )}
                />
                <span
                  className={cn(
                    "transition-all duration-300 origin-left",
                    isCollapsed
                      ? "w-0 opacity-0 translate-x-[-10px]"
                      : "w-auto opacity-100 translate-x-0",
                  )}
                >
                  {item.title}
                </span>
                {isActive && !isCollapsed && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </Link>
            );
            if (isCollapsed) {
              return (
                <TooltipProvider key={index} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>{LinkContent}</TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="font-medium ml-4 bg-foreground text-background border-none shadow-xl"
                    >
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }
            return <div key={index}>{LinkContent}</div>;
          })}
        </nav>
      </div>

      <div
        className={cn(
          "p-4 flex flex-col gap-2 transition-all duration-300 shrink-0",
          isCollapsed ? "items-center justify-center" : "",
        )}
      >
        <Button
          variant="ghost"
          className={cn(
            "w-full gap-3 text-sidebar-foreground/80 hover:text-white hover:bg-primary-foreground/20 transition-all whitespace-nowrap rounded-xl h-12",
            isCollapsed
              ? "justify-center px-0 w-10 mx-auto"
              : "justify-start px-4",
          )}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-[18px] w-[18px] shrink-0" />
          ) : (
            <Moon className="h-[18px] w-[18px] shrink-0" />
          )}
          <span
            className={cn(
              "transition-all duration-300 font-semibold",
              isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto",
            )}
          >
            Tema {theme === "dark" ? "Claro" : "Escuro"}
          </span>
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full gap-3 text-sidebar-foreground/80 hover:text-white hover:bg-destructive/90 transition-all whitespace-nowrap rounded-xl h-12",
            isCollapsed
              ? "justify-center px-0 w-10 mx-auto"
              : "justify-start px-4",
          )}
          onClick={onSignOut}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span
            className={cn(
              "transition-all duration-300 font-semibold",
              isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto",
            )}
          >
            Sair
          </span>
        </Button>
      </div>
    </div>
  );
}
interface AppSidebarProps {
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}
export function AppSidebar({
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
}: AppSidebarProps) {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobile = useMobile();
  const [open, setOpen] = useState(false);
  const isCollapsed = !isMobile && !isHovered;
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="fixed top-3 left-3 z-40 lg:hidden shrink-0 text-foreground bg-background/50 backdrop-blur-md rounded-full border border-border/50 shadow-sm h-9 px-3 flex items-center gap-2 hover:bg-background/80"
          >
            <Menu className="h-5 w-5" />
            <span className="font-bold tracking-tight text-sm">
              {NAV_ITEMS.find((item) => pathname.startsWith(item.href))
                ?.title || "SIGESS"}
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="p-0 w-72 border-r-0 bg-sidebar text-sidebar-foreground h-full"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de Navegação</SheetTitle>
          </SheetHeader>
          <SidebarContent
            isCollapsed={false}
            pathname={pathname}
            theme={theme}
            setTheme={setTheme}
            onNavigate={() => setOpen(false)}
            onSignOut={signOut}
          />
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <div
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 z-50 transition-all duration-300 ease-in-out p-4",
        isHovered ? "w-72" : "w-[6.5rem]",
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={cn(
          "flex-1 flex flex-col rounded-[24px] shadow-2xl border border-white/10 overflow-hidden bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out w-full",
        )}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          pathname={pathname}
          theme={theme}
          setTheme={setTheme}
          onNavigate={() => undefined}
          onSignOut={signOut}
        />
      </div>
    </div>
  );
}
