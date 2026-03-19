import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { PersonalDataTabContent } from "./tabs/PersonalDataTabContent";
import { DocumentsTabContent } from "./tabs/DocumentsTabContent";
import { User, FileText } from "lucide-react";
export function RegistrationTabs() {
  return (
    <Tabs defaultValue="personal" className="w-full space-y-6">
      <TabsList className="h-10 overflow-hidden bg-muted/50 border border-border/30">
        <TabsTrigger
          value="personal"
          className="gap-2 data-[state=active]:shadow-sm"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Dados Pessoais</span>
          <span className="sm:hidden">Dados</span>
        </TabsTrigger>
        <TabsTrigger
          value="documents"
          className="gap-2 data-[state=active]:shadow-sm"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Documentos</span>
          <span className="sm:hidden">Docs</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="personal"
        className="mt-6 focus-visible:outline-none focus-visible:ring-0"
      >
        <PersonalDataTabContent />
      </TabsContent>
      <TabsContent
        value="documents"
        className="mt-6 focus-visible:outline-none focus-visible:ring-0"
      >
        <DocumentsTabContent />
      </TabsContent>
    </Tabs>
  );
}
