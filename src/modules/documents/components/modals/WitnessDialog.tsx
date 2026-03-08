import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Switch } from "@/shared/components/ui/switch"
import { FileText, Users } from "lucide-react"

interface WitnessData {
  name: string
  cpf: string
}

interface WitnessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: (witnesses?: { witness1: WitnessData; witness2: WitnessData }) => void
}

export function WitnessDialog({ open, onOpenChange, title, description, onConfirm }: WitnessDialogProps) {
  const [includeWitnesses, setIncludeWitnesses] = useState(false)
  const [witness1, setWitness1] = useState<WitnessData>({ name: "", cpf: "" })
  const [witness2, setWitness2] = useState<WitnessData>({ name: "", cpf: "" })

  const handleConfirm = () => {
    if (includeWitnesses) {
      onConfirm({ witness1, witness2 })
    } else {
      onConfirm(undefined)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="flex items-center space-x-2 border p-4 rounded-lg bg-muted/20">
            <Switch
              id="include-witnesses"
              checked={includeWitnesses}
              onCheckedChange={setIncludeWitnesses}
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
                <Label className="text-xs font-bold uppercase text-muted-foreground">Testemunha 1</Label>
                <div className="grid gap-2">
                  <Label htmlFor="w1-name">Nome Completo</Label>
                  <Input 
                    id="w1-name" 
                    value={witness1.name} 
                    onChange={(e) => setWitness1({...witness1, name: e.target.value})}
                    placeholder="Nome da primeira testemunha"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="w1-cpf">CPF</Label>
                  <Input 
                    id="w1-cpf" 
                    value={witness1.cpf} 
                    onChange={(e) => setWitness1({...witness1, cpf: e.target.value})}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="space-y-3 p-3 border rounded-md">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Testemunha 2</Label>
                <div className="grid gap-2">
                  <Label htmlFor="w2-name">Nome Completo</Label>
                  <Input 
                    id="w2-name" 
                    value={witness2.name} 
                    onChange={(e) => setWitness2({...witness2, name: e.target.value})}
                    placeholder="Nome da segunda testemunha"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="w2-cpf">CPF</Label>
                  <Input 
                    id="w2-cpf" 
                    value={witness2.cpf} 
                    onChange={(e) => setWitness2({...witness2, cpf: e.target.value})}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Gerar Documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
