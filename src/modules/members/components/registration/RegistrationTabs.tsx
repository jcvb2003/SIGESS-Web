import { EntityTabs, TabItem } from "@/shared/components/layout/EntityTabs";
import { PersonalDataTabContent } from "./tabs/PersonalDataTabContent";
import { DocumentsTabContent } from "./tabs/DocumentsTabContent";
import { User, FileText } from "lucide-react";

interface RegistrationTabsProps {
  isEditMode: boolean;
}

export function RegistrationTabs({ isEditMode }: Readonly<RegistrationTabsProps>) {
  const items: TabItem[] = [
    {
      value: "personal",
      label: "Dados Pessoais",
      mobileLabel: "Dados",
      icon: User,
      content: <PersonalDataTabContent isEditMode={isEditMode} />,
    },
    {
      value: "documents",
      label: "Documentos",
      mobileLabel: "Docs",
      icon: FileText,
      content: <DocumentsTabContent />,
    },
  ];

  return (
    <EntityTabs 
      items={items} 
      defaultValue="personal"
      variant="full-height"
      className="animate-in fade-in slide-in-from-bottom-2 duration-500"
    />
  );
}
