import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  FileText,
  PlusCircle,
  Trash,
  ExternalLink,
  FileUp,
  Upload,
  Loader2,
} from "lucide-react";
import { settingsService } from "../../services/settingsService";
import type { DocumentTemplate } from "../../types/settings.types";
export function DocumentsCard() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const templatesQuery = useQuery({
    queryKey: ["settings", "document-templates"],
    queryFn: async () => {
      const { data, error } = await settingsService.getDocumentTemplates();
      if (error) throw error;
      return data;
    },
  });
  const uploadMutation = useMutation({
    mutationFn: async (params: {
      file: File;
      name: string;
      documentType: string;
    }) => {
      const { data, error } =
        await settingsService.uploadDocumentTemplate(params);
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["settings", "document-templates"],
      });
      toast.success("Template enviado com sucesso.");
      setSelectedFile(null);
      setName("");
      setDocumentType("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro ao enviar template.";
      toast.error(message);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (template: DocumentTemplate) => {
      const { error } = await settingsService.deleteDocumentTemplate(template);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["settings", "document-templates"],
      });
      toast.success("Template excluído com sucesso.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro ao excluir template.";
      toast.error(message);
    },
  });
  const templates = templatesQuery.data ?? [];
  const isLoading = templatesQuery.isLoading || templatesQuery.isFetching;
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file && !name) {
      setName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };
  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo PDF para enviar.");
      return;
    }
    await uploadMutation.mutateAsync({
      file: selectedFile,
      name,
      documentType,
    });
  };
  const handleDelete = async (template: DocumentTemplate) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este template?",
    );
    if (!confirmed) {
      return;
    }
    await deleteMutation.mutateAsync(template);
  };
  const formatSize = (size: number) => {
    if (!size || size <= 0) {
      return "-";
    }
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
  const formatDate = (value: string) => {
    if (!value) {
      return "-";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString("pt-BR");
  };
  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "inss_application":
        return "Requerimento do INSS";
      case "residence_declaration":
        return "Declaração de Residência";
      case "representation_term":
        return "Termo de Representação";
      case "other":
        return "Outro";
      default:
        return type || "-";
    }
  };
  return (
    <>
      <Card className="border-border/50 shadow-sm h-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Templates de Documentos
          </CardTitle>
          <CardDescription>
            Gerencie os arquivos base dos PDFs usados nos requerimentos e
            declarações.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 border-t border-border/10 pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {isLoading ? (
              <span>Carregando templates...</span>
            ) : templatesQuery.error ? (
              <span>
                Erro ao carregar templates. Tente novamente mais tarde.
              </span>
            ) : templates.length === 0 ? (
              <span>Nenhum template cadastrado ainda.</span>
            ) : (
              <span>{templates.length} templates cadastrados.</span>
            )}
          </div>
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={handleOpenDialog}
          >
            <PlusCircle className="h-4 w-4" />
            Gerenciar templates de documentos
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg md:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Templates de Documentos</DialogTitle>
            <DialogDescription>
              Consulte os templates já cadastrados e envie novos arquivos em
              PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="flex flex-col gap-3 w-full">
              <h3 className="text-sm font-medium">Templates cadastrados</h3>
              <div className="max-h-72 w-full overflow-y-auto border border-border/40 rounded-md">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 py-2">Nome</TableHead>
                      <TableHead className="px-4 py-2 hidden md:table-cell">
                        Tipo de documento
                      </TableHead>
                      <TableHead className="px-4 py-2 hidden md:table-cell">
                        Tamanho
                      </TableHead>
                      <TableHead className="px-4 py-2 hidden md:table-cell">
                        Criado em
                      </TableHead>
                      <TableHead className="px-4 py-2 text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-6 text-sm text-muted-foreground text-center"
                        >
                          Nenhum template cadastrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      templates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="px-4 py-2 text-sm font-medium">
                            <div className="truncate max-w-[150px] sm:max-w-none">
                              {template.name}
                            </div>
                            <div className="text-xs text-muted-foreground md:hidden mt-1">
                              {getDocumentTypeLabel(template.documentType)}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-2 text-sm text-muted-foreground hidden md:table-cell">
                            {getDocumentTypeLabel(template.documentType)}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-sm text-muted-foreground hidden md:table-cell">
                            {formatSize(template.fileSize)}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-sm text-muted-foreground hidden md:table-cell">
                            {formatDate(template.createdAt)}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="text-foreground gap-2 h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
                                disabled={!template.fileUrl}
                              >
                                <a
                                  href={template.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span className="hidden md:inline">
                                    Abrir
                                  </span>
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/40 gap-2 h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
                                onClick={() => handleDelete(template)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash className="w-4 h-4" />
                                <span className="hidden md:inline">
                                  Excluir
                                </span>
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

            <div className="flex flex-col gap-3 w-full">
              <h3 className="text-sm font-medium">Enviar novo template</h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="template-name"
                    className="text-sm font-medium"
                  >
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
                  <label
                    htmlFor="template-type"
                    className="text-sm font-medium"
                  >
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
                      <SelectItem value="inss_application">
                        Requerimento do INSS
                      </SelectItem>
                      <SelectItem value="residence_declaration">
                        Declaração de Residência
                      </SelectItem>
                      <SelectItem value="representation_term">
                        Termo de Representação
                      </SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="template-file" className="text-sm font-medium">
                  Arquivo PDF
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-full sm:flex-1">
                    <div className="flex items-center gap-2 rounded-md border border-dashed border-border/60 px-3 py-2 bg-muted/40">
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedFile
                            ? `${selectedFile.name} (${formatSize(selectedFile.size)})`
                            : "Nenhum arquivo selecionado"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto flex items-center">
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
                      className="w-full sm:w-auto"
                      onClick={handleChooseFile}
                    >
                      <FileUp className="w-4 h-4 mr-2" />
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

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setIsDialogOpen(false)}
              disabled={uploadMutation.isPending}
            >
              Fechar
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={handleUpload}
              disabled={
                uploadMutation.isPending ||
                !selectedFile ||
                !name.trim() ||
                !documentType.trim()
              }
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
