import { DocumentMemberProvider } from "@/modules/documents/context/DocumentMemberContext";
import { DocumentsHeader } from "@/modules/documents/components/navigation/DocumentsHeader";
import { DocumentsDashboard } from "@/modules/documents/components/navigation/DocumentsDashboard";
export default function Documents() {
  return (
    <DocumentMemberProvider>
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        <DocumentsHeader />
        <DocumentsDashboard />
      </div>
    </DocumentMemberProvider>
  );
}
