import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Ops! Algo deu errado",
  message = "Ocorreu um erro inesperado ao carregar esta parte do sistema.",
  onRetry,
}: ErrorStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[450px] w-full flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
      <div className="relative mb-6">
        <div className="absolute inset-0 blur-2xl bg-destructive/20 rounded-full animate-pulse" />
        <div className="relative bg-destructive/10 p-5 rounded-2xl border border-destructive/20 shadow-inner">
          <AlertCircle className="h-12 w-12 text-destructive" strokeWidth={1.5} />
        </div>
      </div>

      <div className="text-center max-w-md space-y-3">
        <h2 className="text-2xl font-bold tracking-tight text-foreground font-display">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {message}
        </p>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        {onRetry && (
          <Button 
            onClick={onRetry} 
            className="gap-2 shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCcw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={() => navigate("/dashboard")}
          className="gap-2 border-border/50 hover:bg-muted/50 transition-all hover:scale-105 active:scale-95"
        >
          <Home className="h-4 w-4" />
          Voltar ao Início
        </Button>
      </div>

      <p className="mt-12 text-[10px] text-muted-foreground/50 uppercase tracking-widest font-medium">
        SIGESS Error Monitoring Active
      </p>
    </div>
  );
}
