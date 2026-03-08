import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { ReapStatusFilter } from "../hooks/filters/useReapFilters";

interface ReapFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusFilter: ReapStatusFilter;
  onStatusChange: (value: ReapStatusFilter) => void;
  onClear: () => void;
  onApply: () => void;
}

export function ReapFilterPanel({
  open,
  onOpenChange,
  statusFilter,
  onStatusChange,
  onClear,
  onApply,
}: Readonly<ReapFilterPanelProps>) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Filtros de REAP</SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <div className="space-y-3">
            <Label>Situação</Label>
            <RadioGroup
              value={statusFilter}
              onValueChange={(val) => onStatusChange(val as ReapStatusFilter)}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="todos" id="reap-todos" />
                <Label htmlFor="reap-todos" className="font-normal">
                  Todos os Sócios
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pendente" id="reap-pendente" />
                <Label htmlFor="reap-pendente" className="font-normal">
                  Com REAP Pendente
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tem_problema" id="reap-problema" />
                <Label htmlFor="reap-problema" className="font-normal">
                  Com Problema Registrado
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sem_reap" id="reap-sem" />
                <Label htmlFor="reap-sem" className="font-normal">
                  Sem Nenhum REAP Registrado
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={onApply} className="w-full">
            Aplicar Filtros
          </Button>
          <Button variant="outline" onClick={onClear} className="w-full">
            Limpar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
