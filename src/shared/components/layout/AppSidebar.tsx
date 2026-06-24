import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, ChevronsUpDown, Building2, LayoutDashboard, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";
import { usePermissions } from "@/shared/hooks/usePermissions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { useLayoutEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { useMobile } from "@/shared/hooks/useMobile";
import { useEntityData } from "@/shared/hooks/useEntityData";
import { useTenantMode } from "@/shared/hooks/useTenantMode";
import { NAV_ITEMS } from "@/shared/components/layout/navigationItems";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

type SidebarContentProps = {
  isCollapsed: boolean;
  pathname: string;
  onNavigate: () => void;
  accountMenuOpen: boolean;
  onAccountMenuOpenChange: (open: boolean) => void;
  navScrollRef?: React.RefObject<HTMLDivElement | null>;
};

function SidebarContent({
  isCollapsed,
  pathname,
  onNavigate,
  accountMenuOpen,
  onAccountMenuOpenChange,
  navScrollRef,
}: Readonly<SidebarContentProps>) {
  const navigate = useNavigate();
  const { entity, isLoading: isEntityLoading } = useEntityData();

  const nameRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    el.style.fontSize = "20px";
    let size = 20;
    while (size > 11 && el.scrollHeight > el.clientHeight) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
  }, [entity?.shortName]);
  const { activeUnit, availableUnits, hasMultipleUnits, setActiveUnit } = useTenantUnits();
  const { canAccessTenantAdministration } = usePermissions();
  const tenantMode = useTenantMode();
  const isTenantAdministrationOnly =
    canAccessTenantAdministration && availableUnits.length === 0;
  const AGRICULTURE_HIDDEN = new Set(['/requirements', '/reap']);
  const navigationItems = NAV_ITEMS.filter((item) => {
    if (isTenantAdministrationOnly) {
      return item.adminOnly === true;
    }
    if (tenantMode === 'agricultura' && AGRICULTURE_HIDDEN.has(item.href)) {
      return false;
    }
    return !item.adminOnly || canAccessTenantAdministration;
  });

  return (
    <div className="flex h-full flex-col text-sidebar-foreground overflow-hidden">
      <div
        className={cn(
          "flex h-20 items-center px-4 transition-all duration-300 shrink-0",
          isCollapsed && "justify-center",
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div className="flex h-10 w-10 min-w-[2.5rem] items-center justify-center rounded-xl bg-primary-foreground dark:bg-white/20 text-primary shadow-sm overflow-hidden">
            {entity?.logoUrl ? (
              <img
                src={entity.logoUrl}
                alt={entity.shortName || "Logo"}
                className="h-full w-full object-contain p-1.5 logo-multiply"
              />
            ) : isEntityLoading ? (
              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin opacity-50" />
            ) : (
              <img src="/logo.svg" alt="SIGESS" className="h-full w-full object-contain p-1.5 logo-multiply" />
            )}
          </div>
          <div
            className={cn(
              "flex flex-col transition-opacity duration-300 min-w-0 overflow-hidden",
              isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 flex-1",
            )}
          >
            <span
              ref={nameRef}
              className="font-bold leading-tight text-sidebar-foreground break-words block overflow-hidden"
              style={{ fontSize: "20px", maxHeight: "3.5rem" }}
            >
              {entity?.shortName || "SIGESS"}
            </span>
          </div>
        </div>
      </div>

      {/* polo ativo movido para o trigger do dropdown abaixo */}

      <div
        ref={navScrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3"
      >
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(`${item.href}/`));

            let linkStatusClasses =
              "text-sidebar-foreground/80 hover:bg-primary-foreground/20 hover:text-sidebar-foreground dark:hover:bg-white/10 dark:hover:text-white";

            if (isActive) {
              linkStatusClasses =
                "bg-background text-primary shadow-md dark:bg-primary/15 dark:text-primary dark:shadow-primary/10";
            }

            const LinkContent = (
              <Link
                to={item.href}
                onClick={onNavigate}
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
        {hasMultipleUnits && !isCollapsed && (
          <DropdownMenu open={accountMenuOpen} onOpenChange={onAccountMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl h-12 px-4 text-sidebar-foreground/80 hover:text-white hover:bg-primary-foreground/20 transition-all whitespace-nowrap"
              >
                <Building2 className="h-[18px] w-[18px] shrink-0 text-sidebar-foreground/70" />
                <span className="font-semibold truncate flex-1 text-left">
                  {activeUnit?.name ?? "Selecionar polo"}
                </span>
                <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-64" sideOffset={8}>
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Polos disponíveis
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
                {availableUnits.map((unit) => {
                  const isActive = unit.id === activeUnit?.id;
                  return (
                    <DropdownMenuItem
                      key={unit.id}
                      onClick={() => setActiveUnit(unit)}
                      className="group flex items-center gap-2.5 cursor-pointer"
                    >
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className={cn("flex-1 truncate", isActive && "font-semibold")}>
                        {unit.name}
                      </span>
                      {isActive && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-success group-data-[highlighted]:text-inherit" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </div>
              {canAccessTenantAdministration && activeUnit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => { setActiveUnit(null); navigate("/administration"); }}
                    className="gap-2.5 cursor-pointer"
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    <span>Portal do Gestor</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
  const isMobile = useMobile();
  const [open, setOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const navScrollRef = useRef<HTMLDivElement>(null);
  const isExpanded = isMobile || isHovered || accountMenuOpen;
  const isCollapsed = !isExpanded;

  // Clicar num link do nav foca o <a>, o browser faz scrollIntoView dentro do
  // overflow-y-auto do nav div e o scrollTop não-zero persiste após a navegação.
  // Resetar aqui, após o layout, corrige sem remover a capacidade de scroll em
  // viewports muito pequenos (onde os 10 itens podem não caber).
  useLayoutEffect(() => {
    if (navScrollRef.current) navScrollRef.current.scrollTop = 0;
  }, [pathname]);

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

            onNavigate={() => setOpen(false)}

            accountMenuOpen={accountMenuOpen}
            onAccountMenuOpenChange={setAccountMenuOpen}
            navScrollRef={navScrollRef}
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
          onNavigate={() => undefined}
          accountMenuOpen={accountMenuOpen}
          onAccountMenuOpenChange={setAccountMenuOpen}
          navScrollRef={navScrollRef}
        />
      </div>
    </aside>
  );
}
