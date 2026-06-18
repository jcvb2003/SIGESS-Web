import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { memberService } from "@/modules/members/services/memberService";
import { memberQueryKeys } from "@/modules/members/queryKeys";
import { MemberFicha } from "@/modules/members/components/print/MemberFicha";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export default function MemberFichaPage() {
  const { id } = useParams();

  const { data: member, isLoading, error } = useQuery({
    queryKey: id ? memberQueryKeys.detail(id) : ["member", null],
    queryFn: () => (id ? memberService.getMemberById(id) : null),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-slate-600 animate-pulse">Carregando ficha do sócio...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md">
          <div className="h-16 w-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Erro ao carregar dados</h1>
          <p className="text-slate-500 mb-6">Não foi possível encontrar as informações deste sócio ou o identificador é inválido.</p>
          <Button onClick={() => window.close()} variant="outline">Fechar Aba</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/50 py-8 print:p-0 print:bg-white">
      {/* Floating Action Button for Print */}
      <div className="fixed bottom-8 right-8 no-print z-50">
        <Button 
          onClick={() => window.print()} 
          size="lg"
          className="rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-white gap-2 h-14 px-6 scale-110 active:scale-95 transition-all"
        >
          <Printer className="h-5 w-5" />
          <span className="font-bold">Imprimir Ficha</span>
        </Button>
      </div>

      <MemberFicha member={member} />
    </div>
  );
}
