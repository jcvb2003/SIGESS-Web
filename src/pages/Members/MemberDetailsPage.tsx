import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { memberService } from "@/modules/members/services/memberService";
import { RegistrationForm } from "@/modules/members/components/registration/RegistrationForm";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
export default function MemberDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: member,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["member", id],
    queryFn: () => (id ? memberService.getMemberById(id) : null),
    enabled: !!id,
  });
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !member) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-xl font-semibold text-destructive">
          Erro ao carregar dados do sócio
        </h2>
        <p className="text-muted-foreground">
          Não foi possível encontrar o sócio solicitado ou ocorreu um erro na
          busca.
        </p>
        <Button onClick={() => navigate("/members")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para lista
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/members")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Editar Sócio</h1>
        </div>
        <p className="text-muted-foreground ml-10">
          Atualize as informações do cadastro do sócio.
        </p>
      </div>

      <RegistrationForm initialData={member} memberId={id} />
    </div>
  );
}
