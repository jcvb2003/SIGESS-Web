import { MemberRegistrationForm } from "../../types/member.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEntityData } from "@/modules/settings/hooks/useEntityData";

interface MemberFichaProps {
  readonly member: MemberRegistrationForm;
}

const InfoGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <h3 className="text-[11px] font-black text-emerald-800 uppercase border-b border-emerald-100 pb-0.5 mb-2 tracking-wider">
      {title}
    </h3>
    <div className="grid grid-cols-3 gap-y-3 gap-x-4">
      {children}
    </div>
  </div>
);

const LabelValue = ({ label, value, className = "" }: { label: string; value?: string | null; className?: string }) => (
  <div className={`flex flex-col ${className}`}>
    <span className="text-[9px] text-muted-foreground uppercase font-bold leading-tight">
      {label}
    </span>
    <span className="text-[11px] font-bold text-slate-900 truncate">
      {value || "-"}
    </span>
  </div>
);

export function MemberFicha({ member }: MemberFichaProps) {
  const { entity } = useEntityData();
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="relative max-w-[210mm] mx-auto bg-white p-10 shadow-sm print:shadow-none min-h-[297mm] font-dmsans border border-slate-100 print:border-none overflow-hidden flex flex-col">
      
      {/* Marca d'água de fundo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-30deg]">
        <div className="flex flex-col items-center">
          <img src="/logo.svg" alt="" className="w-80 h-80 object-contain grayscale brightness-0" />
          <span className="text-[120px] font-black tracking-[0.2em] mt-[-40px]">SIGESS</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header Compacto */}
        <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-white rounded-lg flex items-center justify-center p-1 border border-slate-100 shadow-sm">
              <img src={entity?.logoUrl || "/logo.svg"} alt="Logo" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none uppercase">
                {entity?.name || "FICHA DE REGISTRO DO SÓCIO"}
              </h1>
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest mt-1">
                CNPJ: {entity?.cnpj || "00.000.000/0001-00"}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5 uppercase font-medium">
                Documento emitido pelo sistema SIGESS em {today}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex flex-col items-end justify-center">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Matrícula</span>
              <span className="text-lg font-black text-emerald-600 leading-none">#{member.codigoDoSocio || "0000"}</span>
            </div>
            <div className="h-24 w-20 border-2 border-slate-100 rounded-lg flex items-center justify-center bg-slate-50/50 overflow-hidden shadow-inner">
              {member.fotos?.[0]?.foto_url ? (
                <img src={member.fotos[0].foto_url} alt="Foto" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[8px] text-slate-300 font-black text-center px-2 uppercase">Foto 3x4</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {/* Dados Pessoais */}
          <InfoGroup title="01. Dados Pessoais">
            <LabelValue label="Nome Completo" value={member.nome} className="col-span-2" />
            <LabelValue label="CPF" value={member.cpf} />
            <LabelValue label="Apelido / Vulgo" value={member.apelido} />
            <LabelValue label="Data Nascimento" value={member.dataDeNascimento ? format(new Date(member.dataDeNascimento), "dd/MM/yyyy") : null} />
            <LabelValue label="Sexo" value={member.sexo} />
            <LabelValue label="Naturalidade" value={`${member.naturalidade} / ${member.ufNaturalidade}`} />
            <LabelValue label="Estado Civil" value={member.estadoCivil} />
            <LabelValue label="Nacionalidade" value={member.nacionalidade} />
            <LabelValue label="Escolaridade" value={member.escolaridade} />
            <LabelValue label="Alfabetizado" value={member.alfabetizado} />
            <LabelValue label="Nome do Pai" value={member.pai} className="col-span-2" />
            <LabelValue label="Nome da Mãe" value={member.mae} className="col-span-2" />
          </InfoGroup>

          {/* Documentação */}
          <InfoGroup title="02. Documentação e Contato">
            <LabelValue label="RG / Expedidor" value={`${member.rg} ${member.ufRg}`} />
            <LabelValue label="Data Expedição" value={member.dataExpedicaoRg ? format(new Date(member.dataExpedicaoRg), "dd/MM/yyyy") : null} />
            <LabelValue label="Título Eleitor" value={member.tituloEleitor} />
            <LabelValue label="Zona / Seção" value={`${member.zonaEleitoral} / ${member.secaoEleitoral}`} />
            <LabelValue label="NIT / PIS" value={member.nit} />
            <LabelValue label="CEI / CAEPF" value={member.cei || member.caepf} />
            <LabelValue label="E-mail" value={member.email} className="col-span-2" />
            <LabelValue label="Telefone" value={member.telefone} />
          </InfoGroup>

          {/* Endereço */}
          <InfoGroup title="03. Endereço Residencial">
            <LabelValue label="Logradouro" value={`${member.endereco}, ${member.numero}`} className="col-span-2" />
            <LabelValue label="Bairro" value={member.bairro} />
            <LabelValue label="Cidade / UF" value={`${member.cidade} - ${member.uf}`} />
            <LabelValue label="CEP" value={member.cep} />
            <LabelValue label="Localidade" value={member.codigoLocalidade} />
          </InfoGroup>

          {/* Dados Profissionais */}
          <InfoGroup title="04. Dados Profissionais e Entidade">
            <LabelValue label="RGP / Protocolo" value={`${member.rgp} (${member.tipoRgp})`} />
            <LabelValue label="Emissão RGP" value={member.emissaoRgp ? format(new Date(member.emissaoRgp), "dd/MM/yyyy") : null} />
            <LabelValue label="Data Admissão" value={member.dataDeAdmissao ? format(new Date(member.dataDeAdmissao), "dd/MM/yyyy") : null} />
            <LabelValue
              label="Situação Cadastral"
              value={member.situacao}
              className={`col-span-3 ${
                member.situacao === "ATIVO"
                  ? "text-emerald-600"
                  : member.situacao === "INATIVO"
                    ? "text-slate-600"
                    : "text-foreground"
              }`}
            />
          </InfoGroup>

          {/* Observações - Reduzida */}
          {member.observacoes && (
            <div className="mb-4">
              <h3 className="text-[10px] font-black text-emerald-800 uppercase border-b border-emerald-100 pb-0.5 mb-1.5 tracking-wider">
                Observações
              </h3>
              <p className="text-[10px] text-slate-600 leading-tight italic line-clamp-3">
                {member.observacoes}
              </p>
            </div>
          )}
        </div>

        {/* Rodapé e Assinaturas - Bem na base */}
        <div className="mt-auto pt-8 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-20 px-10">
            <div className="flex flex-col items-center">
              <div className="w-full border-t border-slate-400 mb-1" />
              <p className="text-[9px] font-black uppercase text-slate-500">Assinatura do Sócio</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-full border-t border-slate-400 mb-1" />
              <p className="text-[9px] font-black uppercase text-slate-500">Responsável p/ Entidade</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.3em]">
              SIGESS - Sistema de Gestão Sindical • Inteligência em Pesca
            </p>
          </div>
        </div>
      </div>

      {/* Estilo para impressão A4 rígido */}
      <style dangerouslySetInnerHTML={{ __html: String.raw`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 10mm; 
          }
          body { 
            background: white !important; 
            margin: 0; 
            padding: 0; 
          }
          .max-w-\[210mm\] { 
            width: 100%; 
            max-width: 100%; 
            border: none !important; 
            box-shadow: none !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            min-height: 0 !important;
          }
          .min-h-\[297mm\] { min-height: 0 !important; }
          button, .no-print { display: none !important; }
        }
      `}} />
    </div>
  );
}
