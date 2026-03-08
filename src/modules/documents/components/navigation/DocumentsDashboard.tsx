import { useState } from "react"
import { DefesoRequestDocument } from "../templates/defeso-request/DefesoRequestDocument"
import { useDocumentMember } from "../../context/DocumentMemberContext"
import { Card } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { FileText, Gavel } from "lucide-react"
import { WitnessDialog } from "../modals/WitnessDialog"
import { toast } from "sonner"

export function DocumentsDashboard() {
  const { selectedMember } = useDocumentMember()
  const [activeModal, setActiveModal] = useState<'residence' | 'representation' | null>(null)

  if (!selectedMember) {
    return (
      <Card className="p-8 text-center text-muted-foreground bg-muted/10 border-dashed">
        Selecione um sócio acima para visualizar os modelos de documentos disponíveis.
      </Card>
    )
  }

  const handleGenerateResidence = (witnesses?: { witness1: { name: string, cpf: string }, witness2: { name: string, cpf: string } }) => {
    console.log("Gerando Declaração de Residência", { witnesses })
    toast.success("Declaração de Residência gerada com sucesso!")
    // Aqui virá a lógica real de geração de PDF
  }

  const handleGenerateRepresentation = (witnesses?: { witness1: { name: string, cpf: string }, witness2: { name: string, cpf: string } }) => {
    console.log("Gerando Termo de Representação", { witnesses })
    toast.success("Termo de Representação gerado com sucesso!")
    // Aqui virá a lógica real de geração de PDF
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 border-dashed" 
          onClick={() => setActiveModal('residence')}
        >
          <FileText className="h-8 w-8 text-muted-foreground" />
          <span className="font-medium">Declaração de Residência</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 border-dashed" 
          onClick={() => setActiveModal('representation')}
        >
          <Gavel className="h-8 w-8 text-muted-foreground" />
          <span className="font-medium">Termo de Representação</span>
        </Button>
      </div>
      
      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <DefesoRequestDocument />
      </div>

      <WitnessDialog 
        open={activeModal === 'residence'} 
        onOpenChange={(open) => !open && setActiveModal(null)}
        title="Declaração de Residência"
        description="Preencha os dados das testemunhas caso necessário para a Declaração de Residência."
        onConfirm={handleGenerateResidence}
      />

      <WitnessDialog 
        open={activeModal === 'representation'} 
        onOpenChange={(open) => !open && setActiveModal(null)}
        title="Termo de Representação"
        description="Preencha os dados das testemunhas caso necessário para o Termo de Representação."
        onConfirm={handleGenerateRepresentation}
      />
    </div>
  )
}
