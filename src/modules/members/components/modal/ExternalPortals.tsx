import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  getESocialAutomationSettings,
  handleExternalLogin,
} from "@/shared/utils/browserDetection";
import {
  formatGpsCurrencyInput,
  getStoredGpsCurrencyValue,
  hasGpsCurrencyValue,
  normalizeGpsCurrencyValue,
  setStoredGpsCurrencyValue,
} from "@/shared/utils/gpsValue";
import { MemberRegistrationForm } from "../../types/member.types";

interface ExternalPortalsProps {
  readonly cpf: string;
  readonly senhaGov: string;
  readonly nome: string;
  readonly member?: MemberRegistrationForm;
}

export function ExternalPortals({
  cpf,
  senhaGov,
  nome,
  member,
}: ExternalPortalsProps) {
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [valorComercializado, setValorComercializado] = useState(() =>
    getStoredGpsCurrencyValue(),
  );

  const { data: esocialSettingsResponse } = useQuery({
    queryKey: ["members", "external-portals", "esocial-extension-settings"],
    queryFn: getESocialAutomationSettings,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 10000,
  });

  const gpsAtivo = Boolean(
    esocialSettingsResponse?.success && esocialSettingsResponse.data?.gerarGps,
  );

  const openPortal = (url: string, valor?: string) => {
    handleExternalLogin(url, cpf, senhaGov, nome, undefined, valor);
  };

  const handleOpenPortal = (url: string) => {
    if (!gpsAtivo) {
      openPortal(url);
      return;
    }

    setPendingUrl(url);
  };

  const handleConfirmValor = () => {
    const valor = normalizeGpsCurrencyValue(valorComercializado);
    if (!hasGpsCurrencyValue(valor)) {
      return;
    }

    setStoredGpsCurrencyValue(valor);
    if (pendingUrl) {
      openPortal(pendingUrl, valor);
    }
    setPendingUrl(null);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="mr-2 h-7 w-px bg-border/40" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 overflow-hidden border-border/50 p-0 transition-all hover:border-primary/30 hover:bg-accent"
                onClick={() => handleOpenPortal("https://servicos.acesso.gov.br/")}
              >
                <img
                  src="/assets/images/govbr.png"
                  alt="GOV.BR"
                  className="h-[78%] w-[78%] object-contain"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Acessar GOV.BR</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 overflow-hidden border-border/50 p-0 transition-all hover:border-primary/30 hover:bg-accent"
                onClick={() => handleOpenPortal("https://login.esocial.gov.br/login.aspx")}
              >
                <img
                  src="/assets/images/esocial.jpeg"
                  alt="eSocial"
                  className="h-[68%] w-[68%] object-contain"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Acessar eSocial</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-0.5 border-border/50 transition-all hover:border-primary/30 hover:bg-accent"
                onClick={() =>
                  handleExternalLogin(
                    "https://servicos.mte.gov.br/spme-v2/#/login",
                    cpf,
                    senhaGov,
                    nome,
                    member
                      ? {
                          dataPrimeiroRegistro: member.emissaoRgp || member.dataDeAdmissao || "",
                          cep: member.cep || "",
                          endereco: member.endereco || "",
                          numero: member.numero || "",
                          bairro: member.bairro || "",
                          escolaridade: member.escolaridade || "",
                          telefone: member.telefone || "",
                        }
                      : undefined,
                  )
                }
              >
                <Briefcase className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                <span className="text-[7.5px] font-extrabold uppercase leading-none tracking-tighter text-slate-800 dark:text-slate-300">
                  MTE
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Acessar Seguro-Desemprego (MTE)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Dialog open={!!pendingUrl} onOpenChange={(open) => !open && setPendingUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valor comercializado</DialogTitle>
            <DialogDescription>
              A função de GPS está ativa. Informe o valor que deve ser usado na geração automática.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="external-gps-valor" className="text-sm font-medium">
              Valor
            </label>
            <Input
              id="external-gps-valor"
              value={valorComercializado}
              onChange={(event) => setValorComercializado(formatGpsCurrencyInput(event.target.value))}
              placeholder="Ex: 380,00"
              inputMode="numeric"
              maxLength={15}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingUrl(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmValor}
              disabled={!hasGpsCurrencyValue(valorComercializado)}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
