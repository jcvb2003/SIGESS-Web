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
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavigationItem[] = [
  { title: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { title: "Socios", href: "/members", icon: Users },
  { title: "Cadastro", href: "/registration", icon: UserPlus },
  { title: "Documentos", href: "/documents", icon: Files },
  { title: "Requerimentos", href: "/requirements", icon: FileText },
  { title: "REAP", href: "/reap", icon: ClipboardList },
  { title: "Relatorios", href: "/reports", icon: ChartNoAxesCombined },
  { title: "Financeiro", href: "/finance", icon: Wallet },
  { title: "Automacao", href: "/automation", icon: Bot },
  { title: "Configuracoes", href: "/settings", icon: Settings },
];
