import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Lock } from "lucide-react";

interface FeatureRestrictedModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function FeatureRestrictedModal({ open, onOpenChange }: Readonly<FeatureRestrictedModalProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md cursor-default" 
      >
        <DialogHeader className="flex flex-col items-center gap-4 py-4">
          <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <DialogTitle className="text-xl text-center font-bold">
            Acesso restrito
          </DialogTitle>
          <DialogDescription className="text-center text-base text-muted-foreground">
            Esta área é exclusiva do presidente. Entre em contato com o administrador do sistema para solicitar acesso.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button 
            className="flex-1 font-bold" 
            onClick={() => onOpenChange(false)}
          >
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
