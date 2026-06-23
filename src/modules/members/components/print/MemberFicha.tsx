import { useState } from "react";
import { MemberRegistrationForm } from "../../types/member.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEntityData } from "@/modules/settings/hooks/useEntityData";
import { SITUACAO_PRINT, SITUACAO_PRINT_FALLBACK } from "../../constants/memberStatus";
import type { FinanceLancamento } from "@/modules/finance/types/finance.types";
import { getPaymentTypeLabel } from "@/modules/finance/utils/paymentReportLabels";

interface MemberFichaProps {
  readonly member: MemberRegistrationForm;
  readonly financialStatement?: FinanceLancamento[];
}

const MONTH_LABELS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

const InfoGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <h3 className="text-[11px] font-black text-primary uppercase border-b border-primary/20 pb-0.5 mb-2 tracking-wider">
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

function getFinancialReference(item: FinanceLancamento) {
  if (item.competencia_mes && item.competencia_ano) {
    return `${String(item.competencia_mes).padStart(2, "0")}/${item.competencia_ano}`;
  }
  if (item.competencia_ano) {
    return String(item.competencia_ano);
  }
  return item.descricao?.trim() || "-";
}

function buildMonthlyGrid(statement: FinanceLancamento[]) {
  const paidMonthly = statement.filter(
    (item) =>
      item.status === "pago" &&
      item.tipo === "mensalidade" &&
      item.competencia_ano &&
      item.competencia_mes,
  );

  const years = Array.from(new Set(paidMonthly.map((item) => item.competencia_ano as number))).sort((a, b) => a - b);
  const paidByYear = new Map<number, Set<number>>();
  const amountByCompetency = new Map<string, number>();

  for (const item of paidMonthly) {
    const year = item.competencia_ano as number;
    const month = item.competencia_mes as number;
    if (!paidByYear.has(year)) paidByYear.set(year, new Set<number>());
    paidByYear.get(year)?.add(month);
    amountByCompetency.set(`${year}-${month}`, Number(item.valor) || 0);
  }

  return { years, paidByYear, amountByCompetency };
}

function getPaidAnnuityYears(statement: FinanceLancamento[]) {
  const paidAnnuities = statement.filter(
    (item) =>
      item.status === "pago" &&
      item.tipo === "anuidade" &&
      item.competencia_ano,
  );

  const years = Array.from(new Set(paidAnnuities.map((item) => item.competencia_ano as number))).sort((a, b) => a - b);
  const amountByYear = new Map<number, number>();

  for (const item of paidAnnuities) {
    amountByYear.set(item.competencia_ano as number, Number(item.valor) || 0);
  }

  return { years, amountByYear };
}

function getFinancialHighlights(statement: FinanceLancamento[]) {
  return statement
    .filter(
      (item) =>
        item.status !== "cancelado" &&
        item.tipo !== "mensalidade" &&
        item.tipo !== "anuidade",
    )
    .sort((a, b) => {
      const dateA = new Date(a.data_pagamento ?? a.created_at ?? 0).getTime();
      const dateB = new Date(b.data_pagamento ?? b.created_at ?? 0).getTime();
      return dateB - dateA;
    });
}

export function MemberFicha({ member, financialStatement = [] }: MemberFichaProps) {
  const { entity } = useEntityData();
  const [photoError, setPhotoError] = useState(false);
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const { years, paidByYear, amountByCompetency } = buildMonthlyGrid(financialStatement);
  const { years: annuityYears, amountByYear: annuityAmountByYear } = getPaidAnnuityYears(financialStatement);
  const financialHighlights = getFinancialHighlights(financialStatement);

  return (
    <>
    <div className="relative max-w-[210mm] mx-auto bg-white p-10 shadow-sm print:shadow-none min-h-[297mm] font-dmsans border border-slate-100 print:border-none overflow-hidden flex flex-col">
      
      {/* Marca d'água de fundo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035]">
        <img src={entity?.logoUrl || "/logo.svg"} alt="" className="w-80 h-80 object-contain" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header Compacto */}
        <div className="flex items-start justify-between border-b-2 border-primary pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-white rounded-lg flex items-center justify-center p-1 border border-slate-100 shadow-sm">
              <img src={entity?.logoUrl || "/logo.svg"} alt="Logo" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none uppercase">
                {entity?.name || "FICHA DE REGISTRO DO SÓCIO"}
              </h1>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
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
              <span className="text-lg font-black text-primary leading-none">#{member.codigoDoSocio || "0000"}</span>
            </div>
            <div className="h-24 w-20 border-2 border-slate-100 rounded-lg flex items-center justify-center bg-slate-50/50 overflow-hidden shadow-inner">
              {member.fotos?.[0]?.foto_url && !photoError ? (
                <img
                  src={member.fotos[0].foto_url}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setPhotoError(true)}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-slate-100">
                  <svg className="w-8 h-8 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
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
            <LabelValue label="CAF" value={member.caf} />
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
                (SITUACAO_PRINT[member.situacao ?? ""] ?? SITUACAO_PRINT_FALLBACK).text
              }`}
            />
          </InfoGroup>

          {/* Observações - Reduzida */}
          {member.observacoes && (
            <div className="mb-4">
              <h3 className="text-[10px] font-black text-primary uppercase border-b border-primary/20 pb-0.5 mb-1.5 tracking-wider">
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
    </div>

    <div className="relative max-w-[210mm] mx-auto bg-white p-10 shadow-sm print:shadow-none min-h-[297mm] font-dmsans border border-slate-100 print:border-none overflow-hidden flex flex-col break-before-page">
      <div className="flex items-start justify-between border-b-2 border-primary pb-4 mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 leading-none uppercase">
            Ficha Financeira do Sócio
          </h2>
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
            {member.nome} • CPF: {member.cpf || "-"}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Matrícula</span>
          <p className="text-lg font-black text-primary leading-none">#{member.codigoDoSocio || "0000"}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-[11px] font-black text-primary uppercase border-b border-primary/20 pb-0.5 mb-3 tracking-wider">
          Mensalidades por Competência
        </h3>
        {years.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-[60px_repeat(12,minmax(0,1fr))] gap-1 text-[8px] font-black uppercase text-slate-500">
              <div>Ano</div>
              {MONTH_LABELS.map((month) => (
                <div key={month} className="text-center">{month}</div>
              ))}
            </div>
            {years.map((year) => (
              <div key={year} className="grid grid-cols-[60px_repeat(12,minmax(0,1fr))] gap-1">
                <div className="flex items-center font-black text-[10px] text-slate-800">{year}</div>
                {MONTH_LABELS.map((_, index) => {
                  const month = index + 1;
                  const checked = paidByYear.get(year)?.has(month) ?? false;
                  return (
                    <div
                      key={`${year}-${month}`}
                      className="h-10 rounded border border-slate-200 flex items-center justify-center text-slate-800 leading-none"
                    >
                      <span className="text-[8px] font-black text-slate-700">
                        {checked ? Number(amountByCompetency.get(`${year}-${month}`) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 italic">Nenhuma mensalidade quitada registrada.</p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-[11px] font-black text-primary uppercase border-b border-primary/20 pb-0.5 mb-3 tracking-wider">
          Anuidades por Competência
        </h3>
        {annuityYears.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {annuityYears.map((year) => (
              <div
                key={year}
                className="h-12 rounded border border-slate-200 flex flex-col items-center justify-center text-slate-800"
              >
                <span className="text-[10px] font-black">{year}</span>
                <span className="text-[9px] font-black text-slate-700">
                  {Number(annuityAmountByYear.get(year) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 italic">Nenhuma anuidade quitada registrada.</p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-[11px] font-black text-primary uppercase border-b border-primary/20 pb-0.5 mb-3 tracking-wider">
          Outros Registros Financeiros
        </h3>
        {financialHighlights.length > 0 ? (
          <div className="space-y-2">
            {financialHighlights.map((item) => (
              <div key={item.id} className="grid grid-cols-[1.4fr_110px_95px_80px] gap-3 text-[10px] border-b border-slate-100 pb-2">
                <div>
                  <p className="font-bold text-slate-900">{getPaymentTypeLabel(item.tipo)}</p>
                  <p className="text-slate-500">{item.descricao?.trim() || "-"}</p>
                </div>
                <div className="font-semibold text-slate-700">Ref: {getFinancialReference(item)}</div>
                <div className="font-semibold text-slate-700">
                  {item.data_pagamento ? format(new Date(item.data_pagamento), "dd/MM/yyyy") : "-"}
                </div>
                <div className="text-right font-black text-slate-900">
                  {Number(item.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 italic">Nenhum outro registro financeiro relevante.</p>
        )}
      </div>

      <div className="mt-auto pt-8 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-20 px-10">
          <div className="flex flex-col items-center">
            <div className="w-full border-t border-slate-400 mb-1" />
            <p className="text-[9px] font-black uppercase text-slate-500">Assinatura do Sócio</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full border-t border-slate-400 mb-1" />
            <p className="text-[9px] font-black uppercase text-slate-500">Responsável Financeiro</p>
          </div>
        </div>
      </div>
    </div>

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
    </>
  );
}
