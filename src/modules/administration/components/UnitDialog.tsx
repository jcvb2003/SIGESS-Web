import { useState } from "react";
import type { TenantUnitInput, TenantUnitRecord } from "@/modules/administration/services/administrationService";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";

interface UnitDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly editingUnit: TenantUnitRecord | null;
  readonly onSubmit: (values: TenantUnitInput) => Promise<void>;
  readonly isSaving: boolean;
}

export function UnitDialog({
  open,
  onOpenChange,
  editingUnit,
  onSubmit,
  isSaving,
}: UnitDialogProps) {
  const [name, setName] = useState(editingUnit?.name ?? "");
  const [code, setCode] = useState(editingUnit?.code ?? "");
  const [city, setCity] = useState(editingUnit?.city ?? "");
  const [state, setState] = useState(editingUnit?.state ?? "");
  const [isActive, setIsActive] = useState(editingUnit?.isActive ?? true);

  const isEditing = Boolean(editingUnit?.id);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setName("");
          setCode("");
          setCity("");
          setState("");
          setIsActive(true);
        } else {
          setName(editingUnit?.name ?? "");
          setCode(editingUnit?.code ?? "");
          setCity(editingUnit?.city ?? "");
          setState(editingUnit?.state ?? "");
          setIsActive(editingUnit?.isActive ?? true);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar polo" : "Novo polo"}</DialogTitle>
          <DialogDescription>
            Organize os polos da entidade e prepare o acesso dos operadores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unit-name">Nome do polo</Label>
            <Input
              id="unit-name"
              placeholder="Polo Oeiras"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit-code">Codigo</Label>
              <Input
                id="unit-code"
                placeholder="oeiras"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-state">UF</Label>
              <Input
                id="unit-state"
                placeholder="PI"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit-city">Cidade</Label>
            <Input
              id="unit-city"
              placeholder="Oeiras"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          {isEditing && (
            <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Polo ativo</p>
                <p className="text-xs text-muted-foreground">
                  Polos inativos nao recebem novos acessos.
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                aria-label="Ativar ou desativar polo"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isSaving || !name.trim()}
            onClick={() =>
              void onSubmit({ id: editingUnit?.id, name, code, city, state, isActive })
            }
          >
            {isEditing ? "Salvar alteracoes" : "Criar polo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
