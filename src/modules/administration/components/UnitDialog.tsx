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
        } else {
          setName(editingUnit?.name ?? "");
          setCode(editingUnit?.code ?? "");
          setCity(editingUnit?.city ?? "");
          setState(editingUnit?.state ?? "");
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
            <label htmlFor="unit-name" className="text-sm font-medium">
              Nome do polo
            </label>
            <Input
              id="unit-name"
              placeholder="Polo Oeiras"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="unit-code" className="text-sm font-medium">
                Codigo
              </label>
              <Input
                id="unit-code"
                placeholder="oeiras"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="unit-state" className="text-sm font-medium">
                UF
              </label>
              <Input
                id="unit-state"
                placeholder="PI"
                maxLength={2}
                value={state}
                onChange={(event) => setState(event.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="unit-city" className="text-sm font-medium">
              Cidade
            </label>
            <Input
              id="unit-city"
              placeholder="Oeiras"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>
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
              void onSubmit({
                id: editingUnit?.id,
                name,
                code,
                city,
                state,
                isActive: editingUnit?.isActive ?? true,
              })
            }
          >
            {isEditing ? "Salvar alteracoes" : "Criar polo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
