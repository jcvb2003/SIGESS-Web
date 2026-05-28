import { Link, useLocation } from "react-router-dom";
import { LogOut, Menu, Fish, Sun, Moon, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { useMobile } from "@/shared/hooks/useMobile";
import { useEntityData } from "@/shared/hooks/useEntityData";
import { NAV_ITEMS } from "@/shared/components/layout/navigationItems";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

type SidebarContentProps = {
  isCollapsed: boolean;
  pathname: string;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  onNavigate: () => void;
  onSignOut: () => void;
  accountMenuOpen: boolean;
  onAccountMenuOpenChange: (open: boolean) => void;
};

function SidebarContent({
  isCollapsed,
  pathname,
  theme,
  setTheme,
  onNavigate,
  onSignOut,
  accountMenuOpen,
  onAccountMenuOpenChange,
}: Readonly<SidebarContentProps>) {
  const { entity, isLoading: isEntityLoading } = useEntityData();
  const { activeUnit, availableUnits, hasMultipleUnits, setActiveUnit } = useTenantUnits();
  const { isAdmin } = usePermissions();
  const navigationItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex h-full flex-col text-sidebar-foreground overflow-hidden">
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
          <div className="flex h-10 w-10 min-w-[2.5rem] items-center justify-center rounded-xl bg-primary-foreground/20 dark:bg-white/10 text-sidebar-foreground transition-all group-hover:bg-primary-foreground group-hover:text-primary dark:group-hover:bg-primary dark:group-hover:text-white shadow-sm overflow-hidden">
            {entity?.logoUrl ? (
              <img
                src={entity.logoUrl}
                alt={entity.shortName || "Logo"}
                className="h-full w-full object-contain p-1.5 logo-multiply"
              />
            ) : isEntityLoading ? (
              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin opacity-50" />
            ) : (
              <Fish className="h-6 w-6" />
            )}
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

      {!isCollapsed && activeUnit && hasMultipleUnits ? (
        <div className="px-4 pb-2">
          <div className="rounded-xl border border-white/10 bg-primary-foreground/10 p-3 dark:bg-white/5">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/60">
              Polo ativo
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-sidebar-foreground">
              <Building2 className="h-4 w-4 text-sidebar-foreground/70" />
              <span className="truncate">{activeUnit.name}</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(`${item.href}/`));

            const handleItemClick = () => {
              onNavigate();
            };

            let linkStatusClasses =
              "text-sidebar-foreground/80 hover:bg-primary-foreground/20 hover:text-sidebar-foreground dark:hover:bg-white/10 dark:hover:text-white";

            if (isActive) {
              linkStatusClasses =
                "bg-background text-primary shadow-md dark:bg-primary/15 dark:text-primary dark:shadow-primary/10";
            }

            const LinkContent = (
              <Link
                to={item.href}
                onClick={handleItemClick}
                className={cn(
                  "flex items-center rounded-xl py-3 text-sm font-semibold transition-all whitespace-nowrap relative overflow-hidden group my-1",
                  isCollapsed
                    ? "justify-center px-0 gap-0 w-10 mx-auto"
                    : "justify-start px-3 gap-3 mx-1",
                  linkStatusClasses,
                )}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
                    "group-hover:scale-110",
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
                  <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <TooltipProvider key={item.href} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>{LinkContent}</TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="ml-4 border-none bg-foreground font-medium text-background shadow-xl"
                    >
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return <div key={item.href}>{LinkContent}</div>;
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
              isCollapsed ? "hidden w-0 opacity-0" : "w-auto opacity-100",
            )}
          >
            Tema {theme === "dark" ? "Claro" : "Escuro"}
          </span>
        </Button>
        {hasMultipleUnits && !isCollapsed ? (
          <DropdownMenu open={accountMenuOpen} onOpenChange={onAccountMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl h-12 px-4 text-sidebar-foreground/80 hover:text-white hover:bg-primary-foreground/20 transition-all whitespace-nowrap"
              >
                <LogOut className="h-[18px] w-[18px] shrink-0" />
                <span className="font-semibold">Conta e polos</span>
                <ChevronsUpDown className="ml-auto h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-64">
              {availableUnits.map((unit) => (
                <DropdownMenuItem
                  key={unit.id}
                  onClick={() => setActiveUnit(unit)}
                  className={cn(
                    "flex items-center justify-between",
                    unit.id === activeUnit?.id && "bg-accent",
                  )}
                >
                  <span>{unit.name}</span>
                  {unit.id === activeUnit?.id ? (
                    <span className="text-xs text-muted-foreground">Ativo</span>
                  ) : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
                Sair da conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
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
                isCollapsed ? "hidden w-0 opacity-0" : "w-auto opacity-100",
              )}
            >
              Sair
            </span>
          </Button>
        )}
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
}: Readonly<AppSidebarProps>) {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobile = useMobile();
  const [open, setOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const isExpanded = isMobile || isHovered || accountMenuOpen;
  const isCollapsed = !isExpanded;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="fixed top-3 left-3 z-40 flex h-9 shrink-0 items-center gap-2 rounded-full border border-border/50 bg-background/50 px-3 text-foreground shadow-sm backdrop-blur-md hover:bg-background/80 lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="text-sm font-bold tracking-tight">
              {NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.title ||
                "SIGESS"}
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="h-full w-72 border-r-0 bg-sidebar p-0 text-sidebar-foreground"
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
            accountMenuOpen={accountMenuOpen}
            onAccountMenuOpenChange={setAccountMenuOpen}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 z-50 transition-[width] duration-300 ease-in-out p-4",
        isExpanded ? "w-72" : "w-[6.5rem]",
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={cn(
          "flex-1 flex flex-col rounded-[24px] shadow-2xl border border-white/10 overflow-hidden bg-sidebar text-sidebar-foreground transition-[width,transform] duration-300 ease-in-out w-full",
        )}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          pathname={pathname}
          theme={theme}
          setTheme={setTheme}
          onNavigate={() => undefined}
          onSignOut={signOut}
          accountMenuOpen={accountMenuOpen}
          onAccountMenuOpenChange={setAccountMenuOpen}
        />
      </div>
    </aside>
  );
}
