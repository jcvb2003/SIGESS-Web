import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ImportDialogProps {
  trigger?: React.ReactNode
}

export function ImportDialog({ trigger }: ImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = () => {
    if (!file) return

    // Placeholder logic as requested
    console.log('File selected for import:', file)
    toast.info("Funcionalidade de importação será implementada em breve.")
    
    setOpen(false)
    setFile(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="justify-between w-full">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importar CSV de Sócios
            </div>
            <span className="text-xs text-muted-foreground">CSV / XLSX</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Dados</DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV ou Excel para importar novos sócios.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-4" />
              {file ? (
                <div className="flex flex-col items-center">
                  <span className="font-medium text-primary">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="font-medium">Clique para selecionar</span>
                  <span className="text-xs text-muted-foreground mt-1">ou arraste o arquivo aqui</span>
                </div>
              )}
              <Input 
                ref={fileInputRef}
                type="file" 
                accept=".csv, .xlsx, .xls" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-700 dark:text-yellow-400">
              <p className="font-medium mb-1">Atenção</p>
              <p>Certifique-se que o arquivo segue o modelo padrão de importação para evitar erros.</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleImport} disabled={!file}>
              Importar Arquivo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
