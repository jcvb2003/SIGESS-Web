import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Loader2, Plus, Pencil, ToggleLeft } from "lucide-react";
import { ChargeTypeForm } from "../../forms/ChargeTypeForm";
import { cn } from "@/shared/lib/utils";
import type { ChargeType } from "../../../types/finance.types";
import type { ChargeTypeFormValues } from "../../../schemas/chargeType.schema";

interface ChargeTypesTabProps {
  readonly chargeTypes: readonly ChargeType[];
  readonly loadingChargeTypes: boolean;
  readonly onChargeSubmit: (data: ChargeTypeFormValues, editingCharge: ChargeType | "new") => Promise<void>;
  readonly onToggleActive: (id: string, ativo: boolean) => void;
  readonly isMutationPending: boolean;
}

export function ChargeTypesTab({
  chargeTypes,
  loadingChargeTypes,
  onChargeSubmit,
  onToggleActive,
  isMutationPending,
}: Readonly<ChargeTypesTabProps>) {
  const [editingCharge, setEditingCharge] = useState<ChargeType | "new" | null>(null);

  const handleFormSubmit = async (data: ChargeTypeFormValues) => {
    if (editingCharge) {
      await onChargeSubmit(data, editingCharge);
      setEditingCharge(null);
    }
  };

  const chargesList = (() => {
    if (loadingChargeTypes) {
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando...
        </div>
      );
    }

    if (chargeTypes.length === 0) {
      return (
        <p className="text-xs text-center text-muted-foreground py-8">
          Nenhum tipo de cobrança cadastrado.
        </p>
      );
    }

    return (
      <div className="divide-y rounded-lg border overflow-hidden">
        {chargeTypes.map((ct) => (
          <div
            key={ct.id}
            className={cn(
              "flex items-center justify-between p-3 bg-white",
              !ct.ativo && "opacity-50",
            )}
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {ct.nome}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {ct.categoria === "contribuicao" ? "Contribuição" : "Cadastro Gov."}
                {ct.obrigatoriedade && ` · ${ct.obrigatoriedade}`}
                {ct.valor_padrao != null && ` · R$ ${Number(ct.valor_padrao).toFixed(2)}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                title={ct.ativo ? "Desativar" : "Ativar"}
                onClick={() => onToggleActive(ct.id, !ct.ativo)}
                className="p-1 text-muted-foreground hover:text-primary transition-colors"
              >
                <ToggleLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Editar"
                onClick={() => setEditingCharge(ct)}
                className="p-1 text-muted-foreground hover:text-primary transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  })();

  return (
    <ScrollArea className="h-full px-4 sm:px-6">
      <div className="py-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Contribuições e cadastros governamentais cobráveis
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={editingCharge === "new"}
            onClick={() => setEditingCharge("new")}
            className="h-8 text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo tipo
          </Button>
        </div>

        {editingCharge !== null && (
          <ChargeTypeForm
            initial={editingCharge === "new" ? null : editingCharge}
            isPending={isMutationPending}
            onSubmit={handleFormSubmit}
            onCancel={() => setEditingCharge(null)}
          />
        )}

        {chargesList}
      </div>
    </ScrollArea>
  );
}
