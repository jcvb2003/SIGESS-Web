import * as React from "react";
import { LucideIcon } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  mobileLabel?: string;
  icon?: LucideIcon;
  content: React.ReactNode;
}

interface EntityTabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  rightActions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: "default" | "full-height";
}

/**
 * EntityTabs - Componente padrão de navegação por abas do SIGESS.
 * Segue o Manifesto de UI: Proibido estilização individual fora deste componente.
 */
export function EntityTabs({
  items,
  defaultValue,
  value,
  onValueChange,
  rightActions,
  className,
  contentClassName,
  variant = "default",
}: Readonly<EntityTabsProps>) {
  const defaultTab = defaultValue ?? items[0]?.value;

  return (
    <Tabs
      defaultValue={defaultTab}
      value={value}
      onValueChange={onValueChange}
      className={cn(
        "w-full flex flex-col min-h-0",
        variant === "full-height" && "flex-1 overflow-hidden",
        className
      )}
    >
      <div className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4",
        variant === "full-height" && "px-5 sm:px-6 pt-4"
      )}>
        <TabsList className={cn(
          "w-full overflow-x-auto scrollbar-hide",
          rightActions ? "sm:flex-1" : "w-full"
        )}>
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="min-w-[100px] sm:min-w-[140px] gap-2"
            >
              {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
              <span className={cn(item.mobileLabel && "hidden sm:inline")}>
                {item.label}
              </span>
              {item.mobileLabel && (
                <span className="sm:hidden">{item.mobileLabel}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {rightActions && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
            {rightActions}
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex-1 min-h-0 rounded-xl",
          variant === "full-height" && "bg-muted/20 border border-border/40 overflow-hidden",
          contentClassName
        )}
      >
        {items.map((item) => (
          <TabsContent
            key={item.value}
            value={item.value}
            className={cn(
              "m-0 focus-visible:outline-none focus-visible:ring-0",
              variant === "full-height" && "h-full overflow-y-auto p-5 sm:p-6"
            )}
          >
            {item.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
