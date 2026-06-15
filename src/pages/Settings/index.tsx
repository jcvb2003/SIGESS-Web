import { EntityTabs } from "@/shared/components/layout/EntityTabs";
import { usePermissions } from "@/shared/hooks/usePermissions";
import {
  Settings as SettingsIcon,
  Building,
  Database,
  KeyRound,
  Palette,
  Puzzle,
  CreditCard,
} from "lucide-react";
import { ImportExportCard } from "@/modules/settings/components/data/ImportExportCard";
import { DocumentsCard } from "@/modules/settings/components/data/DocumentsCard";
import { LocalitiesCard } from "@/modules/settings/components/data/LocalitiesCard";
import { PortariasCard } from "@/modules/settings/components/data/PortariasCard";
import { PhotoImportCard } from "@/modules/settings/components/data/PhotoImportCard";
import { EntityForm } from "@/modules/settings/components/entity/EntityForm";
import { CustomizationForm } from "@/modules/settings/components/entity/CustomizationForm";
import { ParametersForm } from "@/modules/settings/components/parameters/ParametersForm";
import { UserManagementSection } from "@/modules/settings/components/passwords/UserManagementSection";
import { ExtensionSettings } from "@/modules/settings/components/extension/ExtensionSettings";
import { BillingTab } from "@/modules/billing/components/BillingTab";
import { PageHeader } from "@/shared/components/layout/PageHeader";

export default function Settings() {
  const { isAdmin, canManageEntitySettings } = usePermissions();

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
                <fieldset disabled={!isAdmin} className={!isAdmin ? "opacity-50 grayscale pointer-events-none" : ""}>
                  <ImportExportCard />
                </fieldset>
                <DocumentsCard canWrite={canManageEntitySettings} />
                <LocalitiesCard />
                <PortariasCard />
                <fieldset disabled={!isAdmin} className={!isAdmin ? "opacity-50 grayscale pointer-events-none" : ""}>
                  <PhotoImportCard />
                </fieldset>
              </div>
            )
          },
          {
            value: "entidade",
            label: "Entidade",
            icon: Building,
            content: <EntityForm readOnly={!isAdmin} />
          },
          {
            value: "parametros",
            label: "Parâmetros",
            icon: SettingsIcon,
            content: <ParametersForm readOnly={!isAdmin} />
          },
          {
            value: "senhas",
            label: "Senhas",
            icon: KeyRound,
            content: (
              <UserManagementSection />
            )
          },
          {
            value: "personalizacao",
            label: "Personalização",
            icon: Palette,
            content: <CustomizationForm />,
            disabled: !isAdmin
          },
          {
            value: "extensao",
            label: "Extensão",
            icon: Puzzle,
            content: <ExtensionSettings />,
            disabled: !isAdmin
          },
          {
            value: "assinatura",
            label: "Assinatura",
            icon: CreditCard,
            content: <BillingTab />,
          }
        ]}
      />
    </div>
  );
}
