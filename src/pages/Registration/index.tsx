import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { RegistrationForm } from "@/modules/members/components/registration/RegistrationForm";
import { PageHeader } from "@/shared/components/layout/PageHeader";

export default function Registration() {
  const navigate = useNavigate();
  const handleBackToMembers = () => {
    navigate("/members");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Cadastro de Sócio"
        description="Preencha os dados do sócio com as mesmas informações do sistema anterior."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl"
            type="button"
            onClick={handleBackToMembers}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar para lista</span>
          </Button>
        }
      />

      <RegistrationForm />
    </div>
  );
}
