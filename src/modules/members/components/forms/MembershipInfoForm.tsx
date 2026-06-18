import { useFormContext, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { TextField } from "@/shared/components/form-fields/fields/TextField";
import { DateField } from "@/shared/components/form-fields/fields/DateField";
import { SelectField } from "@/shared/components/form-fields/fields/SelectField";
import { TextareaField } from "@/shared/components/form-fields/fields/TextareaField";
import { masks } from "@/shared/utils/masks/inputMasks";
import { MemberPhotoField } from "../form-fields/MemberPhotoField";
import {
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Download,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  useMemberCodeGenerator,
  REGISTRATION_CODE_PATTERN,
} from "../../hooks/registration/useMemberCodeGenerator";
import { MemberRegistrationSchemaType } from "../../schemas/memberRegistration.schema";
import { getAutoRegistrationSnapshot } from "@/shared/utils/browserDetection";
import { formatDateForInput } from "@/shared/utils/formatters/dateFormatters";
import { toast } from "sonner";

interface MembershipInfoFormProps {
  isEditMode: boolean;
}

type CapturedPessoaData = Partial<MemberRegistrationSchemaType> & {
  fontes?: Record<string, { capturado?: boolean; timestamp?: number } | undefined>;
};

const CAPTURED_FIELDS: Array<keyof MemberRegistrationSchemaType> = [
  "codigoDoSocio",
  "dataDeAdmissao",
  "situacao",
  "observacoes",
  "cpf",
  "nome",
  "apelido",
  "dataDeNascimento",
  "sexo",
  "estadoCivil",
  "pai",
  "mae",
  "nacionalidade",
  "naturalidade",
  "ufNaturalidade",
  "alfabetizado",
  "escolaridade",
  "endereco",
  "numero",
  "bairro",
  "cidade",
  "uf",
  "cep",
  "telefone",
  "email",
  "codigoLocalidade",
  "rg",
  "dataExpedicaoRg",
  "ufRg",
  "tituloEleitor",
  "zonaEleitoral",
  "secaoEleitoral",
  "nit",
  "cei",
  "caepf",
  "caf",
  "rgp",
  "tipoRgp",
  "emissaoRgp",
  "ufRgp",
  "senhaGovInss",
];

const ESCOLARIDADE_MAP: Record<string, MemberRegistrationSchemaType["escolaridade"]> = {
  "ENSINO FUNDAMENTAL INCOMPLETO": "FUNDAMENTAL INCOMPLETO",
  "ENSINO FUNDAMENTAL COMPLETO": "FUNDAMENTAL COMPLETO",
  "ENSINO MÉDIO INCOMPLETO": "MÉDIO INCOMPLETO",
  "ENSINO MÉDIO COMPLETO": "MÉDIO COMPLETO",
  "ENSINO SUPERIOR INCOMPLETO": "SUPERIOR INCOMPLETO",
  "ENSINO SUPERIOR COMPLETO": "SUPERIOR COMPLETO",
};

const DATE_FIELDS = new Set<keyof MemberRegistrationSchemaType>([
  "dataDeAdmissao",
  "dataDeNascimento",
  "dataExpedicaoRg",
  "emissaoRgp",
]);

const CAPTURE_SOURCES = [
  { id: "cadunico", label: "CadÚnico" },
  { id: "pesqbrasil", label: "PesqBrasil" },
  { id: "tse", label: "TSE" },
  { id: "receita", label: "Receita" },
] as const;

function isBlankValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

function formatCpf(cpf?: string): string {
  if (!cpf) return "CPF não informado";
  const clean = cpf.replace(/\D/g, "").padStart(11, "0");
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function normalizeCapturedDate(value: string): string {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return trimmed;

  const [, day, month, year] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(parsed.getTime())) return trimmed;

  return formatDateForInput(parsed);
}

function normalizeCapturedValue(
  field: keyof MemberRegistrationSchemaType,
  value: unknown,
): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (DATE_FIELDS.has(field)) {
    return normalizeCapturedDate(trimmed);
  }

  if (field === "escolaridade") {
    return ESCOLARIDADE_MAP[trimmed.toUpperCase()] ?? trimmed.toUpperCase();
  }

  if (field === "alfabetizado") {
    return trimmed.toUpperCase();
  }

  if (field === "cpf") {
    return trimmed.replace(/\D/g, "");
  }

  return trimmed;
}

export function MembershipInfoForm({
  isEditMode,
}: Readonly<MembershipInfoFormProps>) {
  const form = useFormContext<MemberRegistrationSchemaType>();
  const { control } = form;
  const { handleGenerateCode } = useMemberCodeGenerator(form, isEditMode);

  const codigoDoSocio = useWatch({ control, name: "codigoDoSocio" });
  const isPatternMatch = !!(
    codigoDoSocio && REGISTRATION_CODE_PATTERN.test(String(codigoDoSocio))
  );

  const autoRegistrationQuery = useQuery({
    queryKey: ["members", "auto-registration-snapshot"],
    queryFn: getAutoRegistrationSnapshot,
    staleTime: 10_000,
  });

  const captureSnapshot = autoRegistrationQuery.data?.data;
  const captureEnabled = Boolean(captureSnapshot?.enabled);
  const capturedData = (captureSnapshot?.data ?? null) as CapturedPessoaData | null;
  const captureReady = Boolean(captureEnabled && captureSnapshot?.hasData && capturedData);
  const capturedFontes = capturedData?.fontes ?? {};

  const applyCapturedData = async (mode: "all" | "empty") => {
    if (!capturedData) {
      toast.info("Nenhum dado capturado disponível para inserir.");
      return;
    }

    let applied = 0;
    const touchedFields: Array<keyof MemberRegistrationSchemaType> = [];

    for (const field of CAPTURED_FIELDS) {
      const incomingValue = normalizeCapturedValue(field, capturedData[field]);
      if (isBlankValue(incomingValue)) continue;

      if (mode === "empty") {
        const currentValue = form.getValues(field);
        if (!isBlankValue(currentValue)) continue;
      }

      form.setValue(field, incomingValue as never, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      });
      touchedFields.push(field);
      applied += 1;
    }

    if (applied === 0) {
      toast.info(
        mode === "empty"
          ? "Não havia campos vazios para preencher."
          : "Nenhum dado novo foi aplicado ao formulário.",
      );
      return;
    }

    await form.trigger(touchedFields);
    toast.success(
      mode === "all"
        ? `${applied} campo(s) preenchido(s) com os dados capturados.`
        : `${applied} campo(s) vazio(s) preenchido(s) com os dados capturados.`,
    );
  };

  const situationOptions = [
    { label: "ATIVO", value: "ATIVO" },
    { label: "INATIVO", value: "INATIVO" },
    { label: "APOSENTADO", value: "APOSENTADO" },
    { label: "FALECIDO", value: "FALECIDO" },
    { label: "TRANSFERIDO", value: "TRANSFERIDO" },
    { label: "CANCELADO", value: "CANCELADO" },
    { label: "SUSPENSO", value: "SUSPENSO" },
  ];

  const renderCaptureSource = (sourceId: (typeof CAPTURE_SOURCES)[number]["id"]) => {
    if (sourceId === "receita") {
      const caepfCaptured = Boolean(
        capturedFontes.caepf?.capturado || capturedFontes.esocial?.capturado,
      );
      const cadastroCaptured = Boolean(
        capturedFontes.ecac_cpf?.capturado || capturedFontes.ecac_caepf?.capturado,
      );
      const isActive = caepfCaptured || cadastroCaptured;

      return (
        <div
          key={sourceId}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
        >
          <div className="flex items-center gap-0.5">
            {caepfCaptured ? (
              <CheckCircle2 className="h-3 w-3 text-success" />
            ) : (
              <CircleDashed className="h-3 w-3 text-muted-foreground" />
            )}
            {cadastroCaptured ? (
              <CheckCircle2 className="h-3 w-3 text-success" />
            ) : (
              <CircleDashed className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <span className={isActive ? "font-medium text-foreground" : "font-medium text-muted-foreground"}>
            Receita
          </span>
        </div>
      );
    }

    let captured = Boolean(capturedFontes[sourceId]?.capturado);
    if (sourceId === "cadunico") {
      captured = captured || Boolean(capturedFontes.cadunico_adv?.capturado);
    }
    if (sourceId === "pesqbrasil") {
      captured = captured || Boolean(capturedFontes.pesq_brasil?.capturado);
    }

    const label = CAPTURE_SOURCES.find((source) => source.id === sourceId)?.label ?? sourceId;

    return (
      <div
        key={sourceId}
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
      >
        {captured ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        ) : (
          <CircleDashed className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className={captured ? "font-medium text-foreground" : "font-medium text-muted-foreground"}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <ClipboardList className="h-4.5 w-4.5 text-primary/70" />
          Informações de Registro
        </CardTitle>
        <CardDescription>
          Código de registro, filiação e vinculação do sócio à entidade.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="flex shrink-0 justify-center sm:justify-start">
            <MemberPhotoField />
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <TextField
                    control={control}
                    name="codigoDoSocio"
                    label="Número de Registro"
                    placeholder="Número de registro do sócio"
                    mask={masks.numbers}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mb-[2px] transition-all active:scale-95"
                  onClick={handleGenerateCode}
                  disabled={isPatternMatch}
                  title={isPatternMatch ? "Já está no formato padrão" : "Gerar código"}
                >
                  {isPatternMatch ? (
                    <Sparkles className="h-4 w-4 text-muted-foreground/30" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <DateField
                control={control}
                name="dataDeAdmissao"
                label="Data de filiação"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                control={control}
                name="situacao"
                label="Situação"
                placeholder="Selecione a situação"
                options={situationOptions}
              />

              <div className="rounded-md border bg-muted/10 px-3 py-2">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Dados capturados
                    </div>
                    {captureReady ? (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {CAPTURE_SOURCES.map((source) => renderCaptureSource(source.id))}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => void autoRegistrationQuery.refetch()}
                    title="Atualizar dados capturados"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        autoRegistrationQuery.isFetching ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                </div>

                {autoRegistrationQuery.isLoading ? (
                  <div className="text-xs text-muted-foreground">
                    Lendo dados da extensão...
                  </div>
                ) : captureReady ? (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <div className="truncate text-xs font-semibold text-foreground">
                          {capturedData?.nome || "Pessoa capturada"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCpf(capturedData?.cpf)}
                        </div>
                      </div>
                      {isEditMode ? (
                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2.5 text-[11px]"
                            onClick={() => void applyCapturedData("empty")}
                          >
                            Preencher vazios
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-[11px]"
                            onClick={() => void applyCapturedData("all")}
                          >
                            Sobrescrever
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 shrink-0 px-3 text-[11px]"
                          onClick={() => void applyCapturedData("all")}
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          Preencher
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {!autoRegistrationQuery.data?.success
                      ? "Não foi possível ler os dados da extensão."
                      : !captureEnabled
                        ? "Função desativada na extensão."
                        : "Aguardando dados capturados."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <TextareaField
          control={control}
          name="observacoes"
          label="Observações"
          placeholder="Observações sobre o sócio"
        />
      </CardContent>
    </Card>
  );
}
