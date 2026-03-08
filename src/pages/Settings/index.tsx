import { Tabs, TabsContent } from "@/shared/components/ui/tabs";
import { SettingsTabsNav } from "@/modules/settings/components/navigation/SettingsTabsNav";
import { ImportExportCard } from "@/modules/settings/components/data/ImportExportCard";
import { DocumentsCard } from "@/modules/settings/components/data/DocumentsCard";
import { LocalitiesCard } from "@/modules/settings/components/data/LocalitiesCard";
import { PhotoImportCard } from "@/modules/settings/components/data/PhotoImportCard";
import { EntityForm } from "@/modules/settings/components/entity/EntityForm";
import { CustomizationForm } from "@/modules/settings/components/entity/CustomizationForm";
import { ParametersForm } from "@/modules/settings/components/parameters/ParametersForm";
import { PasswordChangeForm } from "@/modules/settings/components/passwords/PasswordChangeForm";
import { UserManagementSection } from "@/modules/settings/components/passwords/UserManagementSection";
import { PageHeader } from "@/shared/components/layout/PageHeader";

export default function Settings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Configurações"
        description="Gerencie as preferências, dados da entidade e parâmetros do sistema."
      />

      <Tabs defaultValue="dados" className="space-y-6">
        <SettingsTabsNav />

        <TabsContent
          value="dados"
          className="space-y-4 focus-visible:outline-none focus-visible:ring-0"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <ImportExportCard />
            <DocumentsCard />
            <LocalitiesCard />
            <PhotoImportCard />
          </div>
        </TabsContent>

        <TabsContent
          value="entidade"
          className="space-y-4 focus-visible:outline-none focus-visible:ring-0"
        >
          <EntityForm />
        </TabsContent>

        <TabsContent
          value="parametros"
          className="space-y-4 focus-visible:outline-none focus-visible:ring-0"
        >
          <ParametersForm />
        </TabsContent>

        <TabsContent
          value="senhas"
          className="space-y-4 focus-visible:outline-none focus-visible:ring-0"
        >
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
            <PasswordChangeForm />
            <UserManagementSection />
          </div>
        </TabsContent>

        <TabsContent
          value="personalizacao"
          className="space-y-4 focus-visible:outline-none focus-visible:ring-0"
        >
          <CustomizationForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
