import { EntityTabs, TabItem } from "@/shared/components/layout/EntityTabs";
import { useAuth } from "@/modules/auth/context/authContextStore";
import {
  Settings as SettingsIcon,
  Building,
  Database,
  KeyRound,
  Palette,
  Puzzle,
} from "lucide-react";
import { ImportExportCard } from "@/modules/settings/components/data/ImportExportCard";
import { DocumentsCard } from "@/modules/settings/components/data/DocumentsCard";
import { LocalitiesCard } from "@/modules/settings/components/data/LocalitiesCard";
import { PhotoImportCard } from "@/modules/settings/components/data/PhotoImportCard";
import { EntityForm } from "@/modules/settings/components/entity/EntityForm";
import { CustomizationForm } from "@/modules/settings/components/entity/CustomizationForm";
import { ParametersForm } from "@/modules/settings/components/parameters/ParametersForm";
import { PasswordChangeForm } from "@/modules/settings/components/passwords/PasswordChangeForm";
import { UserManagementSection } from "@/modules/settings/components/passwords/UserManagementSection";
import { ExtensionSettings } from "@/modules/settings/components/extension/ExtensionSettings";
import { PageHeader } from "@/shared/components/layout/PageHeader";

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.app_metadata?.role === "admin";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Configurações"
        description="Gerencie as preferências, dados da entidade e parâmetros do sistema."
      />

      <EntityTabs
        defaultValue="dados"
        items={[
          {
            value: "dados",
            label: "Dados",
            icon: Database,
            content: (
              <div className="grid gap-4 lg:grid-cols-2">
                <ImportExportCard />
                <DocumentsCard />
                <LocalitiesCard />
                <PhotoImportCard />
              </div>
            )
          },
          {
            value: "entidade",
            label: "Entidade",
            icon: Building,
            content: <EntityForm />
          },
          {
            value: "parametros",
            label: "Parâmetros",
            icon: SettingsIcon,
            content: <ParametersForm />
          },
          {
            value: "senhas",
            label: "Senhas",
            icon: KeyRound,
            content: (
              <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
                <PasswordChangeForm />
                <UserManagementSection />
              </div>
            )
          },
          {
            value: "personalizacao",
            label: "Personalização",
            icon: Palette,
            content: <CustomizationForm />
          },
          ...(isAdmin ? [{
            value: "extensao",
            label: "Extensão",
            icon: Puzzle,
            content: <ExtensionSettings />
          }] : []) as TabItem[]
        ]}
      />
    </div>
  );
}
