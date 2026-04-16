import { TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useAuth } from "@/modules/auth/context/authContextStore";
import {
  Settings as SettingsIcon,
  Building,
  Database,
  KeyRound,
  Palette,
  Puzzle,
} from "lucide-react";

export function SettingsTabsNav() {
  const { user } = useAuth();
  const isAdmin = user?.app_metadata?.role === "admin";

  return (
    <TabsList className="overflow-x-auto scrollbar-hide w-auto justify-start px-2">
      <TabsTrigger value="dados" className="gap-2">
        <Database className="h-4 w-4" />
        <span className="hidden sm:inline">Dados</span>
      </TabsTrigger>
      <TabsTrigger value="entidade" className="gap-2">
        <Building className="h-4 w-4" />
        <span className="hidden sm:inline">Entidade</span>
      </TabsTrigger>
      <TabsTrigger value="parametros" className="gap-2">
        <SettingsIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Parâmetros</span>
      </TabsTrigger>
      <TabsTrigger value="senhas">
        <KeyRound className="h-4 w-4" />
        <span className="hidden sm:inline">Senhas</span>
      </TabsTrigger>
      <TabsTrigger value="personalizacao" className="gap-2">
        <Palette className="h-4 w-4" />
        <span className="hidden sm:inline">Personalização</span>
      </TabsTrigger>
      
      {isAdmin && (
        <TabsTrigger value="extensao" className="gap-2">
          <Puzzle className="h-4 w-4" />
          <span className="hidden sm:inline">Extensão</span>
        </TabsTrigger>
      )}
    </TabsList>
  );
}
