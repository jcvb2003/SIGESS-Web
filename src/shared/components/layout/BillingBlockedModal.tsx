import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Ban, ExternalLink, MessageSquare } from "lucide-react";

interface BillingBlockedModalProps {
  readonly open: boolean;
  readonly reason: "billing_delinquent" | "manual_suspend" | null;
  readonly paymentUrl?: string | null;
}

const WHATSAPP_URL = "https://wa.me/5591993193461";

export function BillingBlockedModal({ open, reason, paymentUrl }: Readonly<BillingBlockedModalProps>) {
  if (!open) return null;

  const isDelinquent = reason === "billing_delinquent" || reason === null;

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden cursor-default"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-col items-center gap-4 py-4">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Ban className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-2xl text-center">
            {isDelinquent ? "Acesso Bloqueado por Inadimplência" : "Acesso Suspenso"}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {isDelinquent ? (
              <>
                Existe uma pendência financeira associada a este acesso.
                <br />
                Regularize o pagamento para reativar o <strong>SIGESS</strong>.
              </>
            ) : (
              <>
                O acesso foi suspenso pelo administrador do sistema.
                <br />
                Entre em contato para obter mais informações.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
          {isDelinquent && paymentUrl && (
            <Button
              variant="default"
              className="flex-1 gap-2"
              onClick={() => window.open(paymentUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
              Acessar fatura
            </Button>
          )}
          <Button
            variant={isDelinquent && paymentUrl ? "outline" : "default"}
            className="flex-1 gap-2"
            onClick={() => window.open(WHATSAPP_URL, "_blank")}
          >
            <MessageSquare className="h-4 w-4" />
            Falar no WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
