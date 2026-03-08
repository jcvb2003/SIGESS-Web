import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { handleExternalLogin } from "@/shared/utils/browserDetection";

import { Briefcase } from "lucide-react";
import { MemberRegistrationForm } from "../../types/member.types";

interface ExternalPortalsProps {
  readonly cpf: string;
  readonly senhaGov: string;
  readonly nome: string;
  readonly member?: MemberRegistrationForm;
}

export function ExternalPortals({ cpf, senhaGov, nome, member }: ExternalPortalsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-px bg-border/40 mr-2" />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 p-0 overflow-hidden border-border/50 hover:border-primary/30 transition-all hover:bg-accent shrink-0"
              onClick={() =>
                handleExternalLogin(
                  "https://servicos.acesso.gov.br/",
                  cpf,
                  senhaGov,
                  nome,
                )
              }
            >
              <img
                src="https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/atendimento-gov.br/imagens/gov-br_logo-svg.png/@@images/image.png"
                alt="GOV.BR"
                className="w-[78%] h-[78%] object-contain"
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
              className="w-9 h-9 p-0 overflow-hidden border-border/50 hover:border-primary/30 transition-all hover:bg-accent shrink-0"
              onClick={() =>
                handleExternalLogin(
                  "https://login.esocial.gov.br/login.aspx",
                  cpf,
                  senhaGov,
                  nome,
                )
              }
            >
              <img
                src="https://www.gov.br/esocial/pt-br/arquivos/imagens/esocial-vertical/@@images/image.jpeg"
                alt="eSocial"
                className="w-[68%] h-[68%] object-contain"
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
              className="w-9 h-9 flex flex-col gap-0.5 items-center justify-center border-border/50 hover:border-primary/30 transition-all hover:bg-accent shrink-0"
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
                    : undefined
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
  );
}
