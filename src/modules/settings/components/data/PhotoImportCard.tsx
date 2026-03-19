import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Images,
  Image,
  Upload,
  X,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Label } from "@/shared/components/ui/label";
import { Progress } from "@/shared/components/ui/progress";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { toast } from "sonner";
import { usePhotoImport } from "../../hooks/useDataManagement";
type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: () => Promise<{
    values: () => AsyncIterable<{
      kind: string;
      getFile?: () => Promise<File>;
    }>;
  }>;
};
export function PhotoImportCard() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"all" | "newOnly">("all");
  const {
    isImporting,
    progress,
    currentFile,
    report,
    importPhotos,
    cancelImport,
  } = usePhotoImport();
  const handleSelectFolder = async () => {
    try {
      const pickerWindow = window as DirectoryPickerWindow;
      if (!pickerWindow.showDirectoryPicker) {
        toast.error("Seu navegador não suporta seleção de pastas.");
        return;
      }
      const folderHandle = await pickerWindow.showDirectoryPicker();
      if (folderHandle) {
        await importPhotos(folderHandle, mode);
      }
    } catch (error: unknown) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Error selecting folder:", error);
        toast.error(
          "Erro ao selecionar pasta. Certifique-se de usar um navegador compatível (Chrome/Edge).",
        );
      }
    }
  };
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isImporting) {
      toast.warning(
        "Aguarde o término da importação ou cancele-a antes de fechar.",
      );
      return;
    }
    setOpen(newOpen);
  };
  return (
    <Card className="border-border/50 shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Images className="h-5 w-5 text-primary" />
          Importação em Massa de Fotos
        </CardTitle>
        <CardDescription>
          Utilize o navegador para importar fotos dos sócios direto de uma
          pasta.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 border-t border-border/10 pt-4">
        <div className="flex items-center gap-3 rounded-md border border-dashed border-border/60 bg-muted/30 px-3 py-2">
          <Image className="h-5 w-5 text-primary" />
          <p className="text-xs text-muted-foreground">
            Suporte focado em navegadores Chromium (Chrome, Edge, Opera). No
            Firefox a funcionalidade será limitada.
          </p>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="xl"
              className="justify-start gap-2 w-full"
            >
              <Upload className="h-4 w-4" />
              Selecionar pasta de fotos
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Importação em Massa de Fotos</DialogTitle>
              <DialogDescription>
                Importe fotos dos sócios automaticamente. O nome do arquivo deve
                corresponder ao CPF do sócio (apenas números).
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {!isImporting && !report && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">
                      Modo de Importação
                    </Label>
                    <RadioGroup
                      value={mode}
                      onValueChange={(v) => setMode(v as "all" | "newOnly")}
                    >
                      <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="all" id="r1" />
                        <Label htmlFor="r1" className="cursor-pointer flex-1">
                          <span className="font-medium block">
                            Importar todas
                          </span>
                          <span className="text-xs text-muted-foreground font-normal">
                            Atualiza fotos existentes e adiciona novas
                          </span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="newOnly" id="r2" />
                        <Label htmlFor="r2" className="cursor-pointer flex-1">
                          <span className="font-medium block">
                            Apenas novas
                          </span>
                          <span className="text-xs text-muted-foreground font-normal">
                            Pula sócios que já possuem foto cadastrada
                          </span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 flex gap-3 items-start">
                    <ImageIcon className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-400">
                      <p className="font-medium mb-1">Requisitos</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Arquivos devem ser imagens (JPG, PNG)</li>
                        <li>Nomes devem ser CPFs válidos</li>
                      </ul>
                    </div>
                  </div>

                  <Button
                    onClick={handleSelectFolder}
                    className="w-full"
                    size="xl"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Iniciar Importação
                  </Button>
                </div>
              )}

              {isImporting && (
                <div className="space-y-6 py-4 text-center">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto animate-pulse">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium">Importando fotos...</h3>
                    <p className="text-sm text-muted-foreground">
                      Processando: {currentFile}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <Button
                    variant="destructive"
                    onClick={cancelImport}
                    className="w-full"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar Importação
                  </Button>
                </div>
              )}

              {report && !isImporting && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 mx-auto">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium">
                      Importação Finalizada
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md text-center border border-green-100 dark:border-green-900/30">
                      <span className="block text-2xl font-bold text-green-600 dark:text-green-400">
                        {report.success}
                      </span>
                      <span className="text-xs text-green-700 dark:text-green-300">
                        Sucesso
                      </span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-center border border-red-100 dark:border-red-900/30">
                      <span className="block text-2xl font-bold text-red-600 dark:text-red-400">
                        {report.failed}
                      </span>
                      <span className="text-xs text-red-700 dark:text-red-300">
                        Falhas
                      </span>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-center border border-yellow-100 dark:border-yellow-900/30">
                      <span className="block text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {report.skipped}
                      </span>
                      <span className="text-xs text-yellow-700 dark:text-yellow-300">
                        Pulados
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-md text-center border border-gray-100 dark:border-gray-900/30">
                      <span className="block text-2xl font-bold text-gray-600 dark:text-gray-400">
                        {report.notFound}
                      </span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Não Encontrados
                      </span>
                    </div>
                  </div>

                  {report.details.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Detalhes de Erros/Falhas
                      </Label>
                      <ScrollArea className="h-32 w-full rounded-md border p-2 text-xs">
                        <ul className="space-y-1">
                          {report.details.map((detail, i) => (
                            <li key={i} className="text-muted-foreground">
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </div>
                  )}

                  <Button onClick={() => setOpen(false)} className="w-full">
                    Concluir
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
