import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { memberService } from "@/modules/members/services/memberService";
import { memberQueryKeys } from "@/modules/members/queryKeys";
import { MemberCard } from "@/modules/members/components/print/MemberCard";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useEntityData } from "@/modules/settings/hooks/useEntityData";

export default function MemberCardPage() {
  const { id } = useParams();
  const [model, setModel] = useState<0 | 1>(0);

  const { data: member, isLoading, error } = useQuery({
    queryKey: id ? memberQueryKeys.detail(id) : ["member", null],
    queryFn: () => (id ? memberService.getMemberById(id) : null),
    enabled: !!id,
  });

  const { entity } = useEntityData();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Erro ao carregar dados</h1>
          <Button onClick={() => window.close()} variant="outline">Fechar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/50 flex flex-col items-center justify-center py-8 print:p-0 print:bg-white print:justify-start print:min-h-0">
      {/* Floating Action Button for Print */}
      <div className="fixed bottom-8 right-8 no-print z-50">
        <Button 
          onClick={() => window.print()} 
          size="lg"
          className="rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-white gap-2 h-14 px-6 scale-110 active:scale-95 transition-all"
        >
          <Printer className="h-5 w-5" />
          <span className="font-bold">Imprimir Carteirinha</span>
        </Button>
      </div>

      <div className="no-print mb-8 text-center">
        <h1 className="text-2xl font-black text-slate-800">Pré-visualização da Carteirinha</h1>
        <p className="text-sm text-slate-500">O tamanho está ajustado para o padrão de cartões de identificação.</p>
      </div>

      {/* Seletor de modelo — pronto para alternar entre versões futuras */}
      <div className="no-print flex justify-center gap-2 mb-4">
        {([0, 1] as const).map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setModel(i)}
            className={cn(
              "h-2 w-2 rounded-full transition-all",
              model === i ? "bg-primary scale-125" : "bg-slate-300 hover:bg-slate-400"
            )}
            aria-label={`Modelo ${i + 1}`}
          />
        ))}
      </div>

      <MemberCard member={member} entity={entity} />
    </div>
  );
}
