import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { FileText } from "lucide-react";
import { WitnessForm, WitnessData } from "../forms/WitnessForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { formatDateForInput } from "@/shared/utils/formatters/dateFormatters";
import { CalendarIcon } from "lucide-react";
interface WitnessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: (data: {
    witnesses?: {
      witness1: WitnessData;
      witness2: WitnessData;
    };
    modelId?: string;
    documentDate?: string;
  }) => void;
  availableModels?: {
    id: string;
    name: string;
  }[];
}
export function WitnessDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  availableModels = [],
}: WitnessDialogProps) {
  const [includeWitnesses, setIncludeWitnesses] = useState(false);
  const [witness1, setWitness1] = useState<WitnessData>({
    name: "",
    cpf: "",
    rg: "",
  });
  const [witness2, setWitness2] = useState<WitnessData>({
    name: "",
    cpf: "",
    rg: "",
  });
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [documentDate, setDocumentDate] = useState<string>(
    formatDateForInput(new Date()),
  );
  const resolvedModel = selectedModel || availableModels[0]?.id || "";
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDocumentDate(formatDateForInput(new Date()));
    }
    onOpenChange(nextOpen);
  };
  const handleConfirm = () => {
    const data: {
      witnesses?: {
        witness1: WitnessData;
        witness2: WitnessData;
      };
      modelId?: string;
      documentDate?: string;
    } = {
      modelId: resolvedModel,
      documentDate,
    };
    if (includeWitnesses) {
      data.witnesses = { witness1, witness2 };
    }
    onConfirm(data);
    handleOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={availableModels.length > 0 ? "space-y-2" : "hidden"}>
                <Label htmlFor="model-select">Modelo do Documento</Label>
                <Select value={resolvedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger id="model-select">
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            <div className="space-y-2">
              <Label htmlFor="document-date">Data do Documento</Label>
              <div className="relative">
                <Input
                  id="document-date"
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  className="pr-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4"
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
              </div>
            </div>
          </div>

          <WitnessForm
            includeWitnesses={includeWitnesses}
            onIncludeChange={setIncludeWitnesses}
            witness1={witness1}
            onWitness1Change={setWitness1}
            witness2={witness2}
            onWitness2Change={setWitness2}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Gerar Documento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
