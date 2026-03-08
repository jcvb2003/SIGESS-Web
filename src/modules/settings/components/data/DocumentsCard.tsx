import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { FileText, PlusCircle, Trash } from 'lucide-react'
import { settingsService } from '../../services/settingsService'
import type { DocumentTemplate } from '../../types/settings.types'

export function DocumentsCard() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [documentType, setDocumentType] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const templatesQuery = useQuery({
    queryKey: ['settings', 'document-templates'],
    queryFn: () => settingsService.getDocumentTemplates(),
    staleTime: 1000 * 60 * 5,
  })

  const uploadMutation = useMutation({
    mutationFn: (params: { file: File; name: string; documentType: string }) =>
      settingsService.uploadDocumentTemplate(params),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', 'document-templates'] })
      toast.success('Template enviado com sucesso.')
      setSelectedFile(null)
      setName('')
      setDocumentType('')
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao enviar template.'
      toast.error(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (template: DocumentTemplate) => settingsService.deleteDocumentTemplate(template),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', 'document-templates'] })
      toast.success('Template excluído com sucesso.')
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao excluir template.'
      toast.error(message)
    },
  })

  const templates = templatesQuery.data ?? []
  const isLoading = templatesQuery.isLoading || templatesQuery.isFetching

  const handleOpenDialog = () => {
    setIsDialogOpen(true)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    if (file && !name) {
      setName(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo PDF para enviar.')
      return
    }

    await uploadMutation.mutateAsync({
      file: selectedFile,
      name,
      documentType,
    })
  }

  const handleDelete = async (template: DocumentTemplate) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este template?')
    if (!confirmed) {
      return
    }

    await deleteMutation.mutateAsync(template)
  }

  const formatSize = (size: number) => {
    if (!size || size <= 0) {
      return '-'
    }
    if (size < 1024) {
      return `${size} B`
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (value: string) => {
    if (!value) {
      return '-'
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <>
      <Card className="border-border/50 shadow-sm h-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Templates de Documentos
          </CardTitle>
          <CardDescription>
            Gerencie os arquivos base dos PDFs usados nos requerimentos e declarações.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 border-t border-border/10 pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {isLoading ? (
              <span>Carregando templates...</span>
            ) : templatesQuery.error ? (
              <span>Erro ao carregar templates. Tente novamente mais tarde.</span>
            ) : templates.length === 0 ? (
              <span>Nenhum template cadastrado ainda.</span>
            ) : (
              <span>{templates.length} templates cadastrados.</span>
            )}
          </div>
          <Button variant="outline" className="justify-start gap-2" onClick={handleOpenDialog}>
            <PlusCircle className="h-4 w-4" />
            Gerenciar templates de documentos
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Templates de Documentos</DialogTitle>
            <DialogDescription>
              Consulte os templates já cadastrados e envie novos arquivos em PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Templates cadastrados</h3>
              <div className="max-h-72 overflow-y-auto border border-border/40 rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo de documento</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-6 text-sm text-muted-foreground text-center">
                          Nenhum template cadastrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      templates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="text-sm">{template.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {template.documentType || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatSize(template.fileSize)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(template.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="text-foreground"
                                disabled={!template.fileUrl}
                              >
                                <a href={template.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <FileText className="w-4 h-4 mr-1" />
                                  Abrir
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(template)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Enviar novo template</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="template-name" className="text-sm font-medium">
                    Nome do template
                  </label>
                  <Input
                    id="template-name"
                    placeholder="Ex.: Requerimento INSS"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="template-type" className="text-sm font-medium">
                    Tipo de documento
                  </label>
                  <Select
                    value={documentType}
                    onValueChange={(value) => setDocumentType(value)}
                  >
                    <SelectTrigger id="template-type">
                      <SelectValue placeholder="Selecione o tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REQUERIMENTO_INSS">Requerimento do INSS</SelectItem>
                      <SelectItem value="DECLARACAO_RESIDENCIA">Declaração de Residência</SelectItem>
                      <SelectItem value="TERMO_REPRESENTACAO">Termo de Representação</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="template-file" className="text-sm font-medium">
                  Arquivo PDF
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 rounded-md border border-dashed border-border/60 px-3 py-2 bg-muted/40">
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedFile
                            ? `${selectedFile.name} (${formatSize(selectedFile.size)})`
                            : 'Nenhum arquivo selecionado'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Input
                      ref={fileInputRef}
                      id="template-file"
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleChooseFile}
                    >
                      Selecionar PDF
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Aceita apenas arquivos PDF. Tamanho recomendado até alguns MB.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={uploadMutation.isPending}
            >
              Fechar
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploadMutation.isPending || !selectedFile || !name.trim() || !documentType.trim()}
            >
              {uploadMutation.isPending ? 'Enviando...' : 'Enviar template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
