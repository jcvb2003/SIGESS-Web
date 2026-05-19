import type { LucideIcon } from "lucide-react";
import {
  Bot,
  ChartNoAxesCombined,
  ClipboardList,
  FileText,
  Files,
  LayoutDashboard,
  Settings,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavigationItem[] = [
  { title: "Início", href: "/dashboard", icon: LayoutDashboard },
  { title: "Sócios", href: "/members", icon: Users },
  { title: "Cadastro", href: "/registration", icon: UserPlus },
  { title: "Documentos", href: "/documents", icon: Files },
  { title: "Requerimentos", href: "/requirements", icon: FileText },
  { title: "REAP", href: "/reap", icon: ClipboardList },
  { title: "Relatórios", href: "/reports", icon: ChartNoAxesCombined },
  { title: "Financeiro", href: "/finance", icon: Wallet },
  { title: "Automação", href: "/automation", icon: Bot },
  { title: "Configurações", href: "/settings", icon: Settings },
];
