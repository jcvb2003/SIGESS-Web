import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Lock, Mail, MessageSquare } from "lucide-react";

interface AccessExpiredModalProps {
  open: boolean;
}

export function AccessExpiredModal({ open }: AccessExpiredModalProps) {
  if (!open) return null;

  return (
    <Dialog open={open}>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden cursor-default" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-col items-center gap-4 py-4">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-destructive animate-pulse" />
          </div>
          <DialogTitle className="text-2xl text-center">
            Período de Teste Expirado
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Seu tempo de acesso para demonstração chegou ao fim.
            <br />
            Para continuar utilizando o <strong>SIGESS</strong> e liberar todas as funcionalidades, entre em contato com o suporte.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button 
            className="flex-1 gap-2" 
            onClick={() => window.open("https://wa.me/5589999999999", "_blank")} // Placeholder Zap
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 gap-2"
            onClick={() => window.location.href = "mailto:suporte@sigess.com.br"}
          >
            <Mail className="h-4 w-4" />
            E-mail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
