import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useDocumentMember } from "../../../context/useDocumentMember";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  FileDown,
  Loader2,
  Save,
  Trash2,
  CalendarIcon,
  User,
  FileText,
  MapPin,
  Home,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { useEntityData } from "@/shared/hooks/useEntityData";
import { useRequestManagement } from "../../../hooks/useRequestManagement";
import { DocumentTemplate } from "@/modules/settings/types/settings.types";
import { usePdfGeneration } from "../../../hooks/usePdfGeneration";
import { useParametersData } from "@/modules/settings/hooks/useParametersData";
import { useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
interface DefesoRequestDocumentProps {
  availableModels?: {
    id: string;
    name: string;
    fileUrl?: string;
  }[];
  isBlocked?: boolean;
}
const DataField = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ElementType;
}) => (
  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
    {Icon && <Icon className="w-4 h-4 mt-0.5 text-primary/60" />}
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground/90">
        {value || "---"}
      </p>
    </div>
  </div>
);
export function DefesoRequestDocument({
  availableModels = [],
  isBlocked = false,
}: DefesoRequestDocumentProps) {
  const { fullMemberData, isLoading: isLoadingMember } = useDocumentMember();
  const { entity } = useEntityData();
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const {
    savedRequest,
    isLoadingRequest,
    saveRequest,
    isSaving,
    deleteRequest,
    isDeleting,
  } = useRequestManagement(fullMemberData?.codigo_do_socio);
  const { parameters } = useParametersData();
  const [requestDate, setRequestDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  useEffect(() => {
    const defaultDate = format(new Date(), "yyyy-MM-dd");
    const updateDate = () => {
      setRequestDate(savedRequest?.data || defaultDate);
    };
    updateDate();
  }, [savedRequest]);
  const { generatePdf, isGenerating } = usePdfGeneration();
  const resolvedModel = selectedModel || availableModels[0]?.id || "";
  const handleSave = async () => {
    if (!fullMemberData || !fullMemberData.codigo_do_socio) {
      toast.error("Dados do sócio incompletos (código do sócio ausente).");
      return;
    }
    const data = {
      codigo_do_socio: fullMemberData.codigo_do_socio,
      nome: fullMemberData.nome,
      cpf: fullMemberData.cpf,
      data: requestDate,
    };
    await saveRequest(data);
    setIsSaveDialogOpen(false);
  };
  const handleDelete = async () => {
    if (!savedRequest) return;
    await deleteRequest(savedRequest.id);
    setIsDeleteDialogOpen(false);
  };
  const handleGeneratePdf = async () => {
    if (!savedRequest) {
      toast.error("Salve o requerimento antes de gerar o PDF.");
      return;
    }
    if (!resolvedModel) {
      toast.error("Selecione um modelo para gerar o PDF.");
      return;
    }
    const model = availableModels.find((m) => m.id === resolvedModel);
    if (!model || !model.fileUrl) {
      toast.error("Modelo inválido ou sem arquivo PDF associado.");
      return;
    }
    if (!fullMemberData) {
      toast.error("Dados do sócio não disponíveis.");
      return;
    }
    await generatePdf(
      model as unknown as DocumentTemplate,
      fullMemberData,
      entity,
      { ...savedRequest, data: requestDate },
      parameters,
    );
  };
  if (isLoadingMember || isLoadingRequest) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!fullMemberData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Selecione um sócio para visualizar os dados do requerimento.
        </CardContent>
      </Card>
    );
  }
  const fullAddress = [
    fullMemberData.endereco,
    fullMemberData.num ? `Nº ${fullMemberData.num}` : "",
    fullMemberData.bairro ? `Bairro ${fullMemberData.bairro}` : "",
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-semibold">Requerimento de Seguro Defeso</h2>
        {savedRequest && (
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Requerimento Salvo em {formatDate(savedRequest.data)}
          </div>
        )}
      </div>

      <Card className="overflow-hidden border-none shadow-md ring-1 ring-zinc-200">
        <CardHeader className="bg-zinc-50/50 border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Dados do Requerente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-primary/80">
              <FileText className="w-4 h-4" />
              Documentos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <DataField label="RGP" value={fullMemberData.num_rgp} />
              <DataField
                label="Data do RGP"
                value={formatDate(fullMemberData.emissao_rgp)}
              />
              <DataField label="NIS/NIT/PIS" value={fullMemberData.nit} />
              <DataField label="CEI" value={fullMemberData.cei} />
              <DataField label="CAEPF" value={fullMemberData.caepf} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-primary/80">
              <MapPin className="w-4 h-4" />
              Contato e Localização
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <DataField label="Endereço Completo" value={fullAddress} icon={Home} />
              </div>
              <DataField
                label="Telefone"
                value={fullMemberData.telefone}
                icon={Smartphone}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="space-y-2 w-full md:max-w-xs">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="w-3 h-3" />
                Data do Requerimento
              </Label>
              <div className="relative">
                <Input
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="bg-white pl-3 pr-10 hover:border-primary/50 transition-colors focus-visible:ring-primary/20 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4"
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none text-primary" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 border-t p-6 bg-muted/5 sm:items-end">
          <div className="w-full sm:w-1/2">
            <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Modelo do Documento
            </Label>
            {availableModels.length > 0 ? (
              <Select value={resolvedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="bg-white">
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
            ) : (
              <div className="text-sm text-muted-foreground italic p-2 border rounded bg-background">
                Nenhum modelo disponível
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
            {savedRequest ? (
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Requerimento
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => setIsSaveDialogOpen(true)}
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Requerimento
                  </>
                )}
              </Button>
            )}

            <Button
              variant="default"
              onClick={handleGeneratePdf}
              disabled={isGenerating || !savedRequest || isBlocked}
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Gerar PDF
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar salvamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente salvar o requerimento deste sócio?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente excluir este requerimento? Essa ação não poderá
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
