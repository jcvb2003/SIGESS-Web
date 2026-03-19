import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Users } from "lucide-react";
export interface WitnessData {
  name: string;
  cpf: string;
  rg: string;
}
interface WitnessFormProps {
  includeWitnesses: boolean;
  onIncludeChange: (include: boolean) => void;
  witness1: WitnessData;
  onWitness1Change: (data: WitnessData) => void;
  witness2: WitnessData;
  onWitness2Change: (data: WitnessData) => void;
}
export function WitnessForm({
  includeWitnesses,
  onIncludeChange,
  witness1,
  onWitness1Change,
  witness2,
  onWitness2Change,
}: WitnessFormProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 border p-4 rounded-lg bg-muted/20">
        <Switch
          id="include-witnesses"
          checked={includeWitnesses}
          onCheckedChange={onIncludeChange}
        />
        <Label htmlFor="include-witnesses" className="flex-1 cursor-pointer">
          <span className="font-medium block">Incluir Testemunhas</span>
          <span className="text-xs text-muted-foreground font-normal">
            Habilite para preencher os dados das duas testemunhas
          </span>
        </Label>
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>

      {includeWitnesses && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-3 p-3 border rounded-md">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Testemunha 1
            </Label>
            <div className="grid gap-2">
              <Label htmlFor="w1-name">Nome Completo</Label>
              <Input
                id="w1-name"
                value={witness1.name}
                onChange={(e) =>
                  onWitness1Change({ ...witness1, name: e.target.value })
                }
                placeholder="Nome da primeira testemunha"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="w1-cpf">CPF</Label>
              <Input
                id="w1-cpf"
                value={witness1.cpf}
                onChange={(e) =>
                  onWitness1Change({ ...witness1, cpf: e.target.value })
                }
                placeholder="000.000.000-00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="w1-rg">RG</Label>
              <Input
                id="w1-rg"
                value={witness1.rg}
                onChange={(e) =>
                  onWitness1Change({ ...witness1, rg: e.target.value })
                }
                placeholder="RG da testemunha"
              />
            </div>
          </div>

          <div className="space-y-3 p-3 border rounded-md">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Testemunha 2
            </Label>
            <div className="grid gap-2">
              <Label htmlFor="w2-name">Nome Completo</Label>
              <Input
                id="w2-name"
                value={witness2.name}
                onChange={(e) =>
                  onWitness2Change({ ...witness2, name: e.target.value })
                }
                placeholder="Nome da segunda testemunha"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="w2-cpf">CPF</Label>
              <Input
                id="w2-cpf"
                value={witness2.cpf}
                onChange={(e) =>
                  onWitness2Change({ ...witness2, cpf: e.target.value })
                }
                placeholder="000.000.000-00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="w2-rg">RG</Label>
              <Input
                id="w2-rg"
                value={witness2.rg}
                onChange={(e) =>
                  onWitness2Change({ ...witness2, rg: e.target.value })
                }
                placeholder="RG da testemunha"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
