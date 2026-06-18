import { MemberRegistrationForm } from "../../types/member.types";
import { format, addYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";
import { EntitySettings } from "@/shared/types/entity.types";
import { SITUACAO_PRINT, SITUACAO_PRINT_FALLBACK } from "../../constants/memberStatus";

interface MemberCardProps {
  readonly member: MemberRegistrationForm;
  readonly entity?: EntitySettings | null;
}

export function MemberCard({ member, entity }: MemberCardProps) {
  const today = new Date();
  const validityDate = addYears(today, 1);
    
  const formattedValidity = format(validityDate, "dd/MM/yyyy");
  const formattedAdmission = member.dataDeAdmissao 
    ? format(new Date(member.dataDeAdmissao), "dd/MM/yyyy") 
    : "---";
  const formattedBirth = member.dataDeNascimento 
    ? format(new Date(member.dataDeNascimento), "dd/MM/yyyy") 
    : "---";
  const emissionDate = format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const qrData = `https://sigess.com.br/validar/${member.cpf || member.id}`;

  const entityName = entity?.name || "COLÔNIA DE PESCADORES Z-33";
  const entityShortName = entity?.shortName || "SIGESS";
  const entityCnpj = entity?.cnpj || "00.000.000/0001-00";
  const logoUrl = entity?.logoUrl || "/logo.svg";

  return (
    <div className="flex flex-col items-center gap-12 py-10 font-dmsans print:gap-0 print:py-0">
      
      {/* Container Principal para Impressão (Frente e Verso Lado a Lado) */}
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-4 bg-white rounded-3xl shadow-2xl border border-slate-100 print:shadow-none print:border-none print:p-0 print:gap-0 relative">
        
        {/* Linha de Dobra (Apenas Impressão) */}
        <div className="hidden print:block absolute top-0 bottom-0 left-1/2 w-0 border-l border-dashed border-slate-300 z-10" />

        {/* ============================================== */}
        {/* FRENTE DO CARTÃO                               */}
        {/* ============================================== */}
        <div className="relative w-[85.6mm] h-[53.98mm] bg-white overflow-hidden flex flex-col shrink-0 border border-slate-200 rounded-xl shadow-lg print:shadow-none">
          
          {/* Cabeçalho Frente - Emerald Pattern */}
          <div className="bg-primary px-4 py-2 flex items-center justify-between shrink-0 relative overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                </svg>
             </div>

             <div className="flex items-center gap-2.5 relative z-10">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm border border-primary/20">
                  <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex flex-col">
                  <h1 className="font-black text-white text-[11px] leading-tight tracking-tight uppercase">{entityShortName}</h1>
                  <p className="text-[5px] font-bold text-primary-foreground uppercase tracking-widest opacity-90">
                    CNPJ: {entityCnpj}
                  </p>
                </div>
             </div>
             <div className="text-right relative z-10">
                <span className="block text-[5px] font-black text-white/60 uppercase tracking-widest">MATRÍCULA</span>
                <span className="text-[8px] font-black text-white leading-none">#{member.codigoDoSocio || "0000"}</span>
             </div>
          </div>

          {/* Subtarja Escura */}
          <div className="bg-primary py-1 flex justify-center items-center shrink-0">
            <h2 className="text-white font-black text-[8px] tracking-[0.2em] uppercase">Carteirinha de Sócio</h2>
          </div>

          {/* Corpo Frente */}
          <div className="flex-1 p-3 flex gap-4 bg-white relative">
            
            {/* Foto Section */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-[18mm] h-[24mm] rounded-lg border-2 border-primary/20 p-0.5 bg-slate-50 shadow-inner overflow-hidden relative">
                {member.fotos?.[0]?.foto_url ? (
                  <img src={member.fotos[0].foto_url} alt="Sócio" className="w-full h-full object-cover rounded-md" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 opacity-20">
                     <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  </div>
                )}
              </div>
              <div className={`w-full py-0.5 rounded text-[5px] font-black text-center uppercase tracking-wider shadow-sm ${
                (SITUACAO_PRINT[member.situacao ?? ""] ?? SITUACAO_PRINT_FALLBACK).bg
              }`}>
                {member.situacao || "PENDENTE"}
              </div>
            </div>

            {/* Dados Section */}
            <div className="flex-1 flex flex-col justify-between pt-0.5">
              <div className="space-y-2">
                <div className="border-b border-slate-100 pb-1">
                  <span className="block text-[5px] text-primary font-black uppercase tracking-wider mb-0.5 tracking-widest">Nome do Associado</span>
                  <div className="text-[10px] font-black text-slate-800 leading-tight uppercase truncate">
                    {member.nome}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                  <div>
                    <span className="block text-[5px] text-primary font-black uppercase tracking-wider tracking-widest">CPF</span>
                    <div className="text-[8px] font-bold text-slate-700 leading-none mt-0.5">{member.cpf || "---"}</div>
                  </div>
                  <div>
                    <span className="block text-[5px] text-primary font-black uppercase tracking-wider tracking-widest">Matrícula</span>
                    <div className="text-[8px] font-bold text-slate-700 leading-none mt-0.5">{member.codigoDoSocio || "---"}</div>
                  </div>
                  <div>
                    <span className="block text-[5px] text-primary font-black uppercase tracking-wider tracking-widest">Admissão</span>
                    <div className="text-[8px] font-bold text-slate-700 leading-none mt-0.5">{formattedAdmission}</div>
                  </div>
                  <div>
                    <span className="block text-[5px] text-primary font-black uppercase tracking-wider tracking-widest">Validade</span>
                    <div className="text-[8px] font-black text-primary leading-none mt-0.5">{formattedValidity}</div>
                  </div>
                </div>
              </div>

              {/* Rodapé da Frente */}
              <div className="mt-2 pt-2 border-t border-slate-100 text-center">
                 <p className="text-[5px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                    {entityName}
                 </p>
              </div>
            </div>
          </div>
          
          {/* Marca d'água de fundo (Frente) */}
          <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.05] w-32 h-32 pointer-events-none">
             <img src="/logo.svg" alt="" className="w-full h-full object-contain" />
          </div>
          
          {/* Glossy Overlay (Digital only) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/20 pointer-events-none print:hidden" />
        </div>

        {/* ============================================== */}
        {/* VERSO DO CARTÃO                                */}
        {/* ============================================== */}
        <div className="relative w-[85.6mm] h-[53.98mm] bg-white overflow-hidden flex flex-col shrink-0 border border-slate-200 rounded-xl shadow-lg print:shadow-none">
          
          {/* Header Verso */}
          <div className="bg-primary h-8 w-full flex items-center justify-center px-4 shrink-0 relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 pointer-events-none scale-x-[-1]">
                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                </svg>
             </div>
             <span className="text-white font-black tracking-widest text-[9px] uppercase relative z-10">
               SIGESS - SISTEMA DE GESTÃO SINDICAL
             </span>
          </div>

          {/* Corpo Verso */}
          <div className="flex-1 px-4 pt-4 pb-2 flex flex-col justify-between bg-white relative">
            
            <div className="flex gap-5 relative z-10">
              {/* QR Code Column */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="w-[18mm] aspect-square border-2 border-primary rounded-lg p-1 bg-white shadow-sm">
                   <QRCodeSVG 
                    value={qrData}
                    size={64}
                    level="H"
                    includeMargin={false}
                    className="w-full h-full"
                   />
                </div>
                <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest">VALIDAÇÃO</span>
              </div>

              {/* Informações Secundárias */}
              <div className="flex-1 flex flex-col gap-2.5 py-0.5">
                <div>
                  <span className="block text-[5px] text-primary font-black uppercase tracking-wider mb-0.5 tracking-widest">RGP - Registro Geral de Pesca</span>
                  <div className="text-[10px] font-black text-slate-800 leading-none">{member.rgp || "NÃO INFORMADO"}</div>
                </div>
                
                <div>
                  <span className="block text-[5px] text-primary font-black uppercase tracking-wider mb-0.5 tracking-widest">NIT / PIS / PASEP</span>
                  <div className="text-[10px] font-black text-slate-800 leading-none">{member.nit || "---"}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-0.5">
                  <div>
                    <span className="block text-[5px] text-primary font-black uppercase tracking-wider mb-0.5 tracking-widest">Nascimento</span>
                    <div className="text-[7px] font-bold text-slate-800 uppercase leading-none truncate">{formattedBirth}</div>
                  </div>
                  <div>
                    <span className="block text-[5px] text-primary font-black uppercase tracking-wider mb-0.5 tracking-widest">Estado Civil</span>
                    <div className="text-[7px] font-bold text-slate-800 uppercase leading-none truncate">{member.estadoCivil || "---"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Group (Signatures + Legal Text) */}
            <div className="mt-auto relative z-10 space-y-3">
              <div className="flex justify-between gap-6 px-4">
                {/* Assinatura Sócio */}
                <div className="flex-1 text-center border-t border-slate-400 pt-0.5">
                  <span className="text-[5px] text-slate-500 font-black uppercase tracking-wider block">
                    Assinatura do Sócio
                  </span>
                </div>
                
                {/* Assinatura Presidente */}
                <div className="flex-1 text-center border-t border-slate-400 pt-0.5">
                  <span className="text-[5px] text-slate-500 font-black uppercase tracking-wider block">
                    {entity?.presidentName || "PRESIDENTE DA ENTIDADE"}
                  </span>
                </div>
              </div>
              
              <div className="text-center space-y-0.5">
                <p className="text-[5px] text-slate-400 font-medium">Emitida em {emissionDate}</p>
                <p className="text-[6px] text-slate-700 font-black uppercase">Documento pessoal e intransferível.</p>
              </div>
            </div>

            {/* Marca d'água de fundo */}
            <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.05] w-40 h-40 pointer-events-none">
               <img src="/logo.svg" alt="" className="w-full h-full object-contain" />
            </div>
          </div>
          
          {/* Glossy Overlay (Digital only) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/20 pointer-events-none print:hidden" />
        </div>

      </div>

      {/* Estilos para Impressão */}
      <style dangerouslySetInnerHTML={{ __html: String.raw`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0; 
          }
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0; 
            padding: 0; 
          }
          /* Garantir que as cores de fundo apareçam */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          
          /* Remover centralização do container pai externo e forçar topo */
          .flex-col.items-center.gap-12 {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Ajuste do container para lado a lado no topo, colados e centralizados horizontalmente */
          .flex-col.md\:flex-row {
            display: flex !important;
            flex-direction: row !important; 
            align-items: flex-start !important;
            justify-content: center !important; /* Centraliza o par na largura da página */
            gap: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding-top: 5mm !important; /* Pequena margem no topo */
          }
          
          /* Garantir que a linha de dobra apareça corretamente entre eles */
          .print\:block.absolute.left-1\/2 {
            display: block !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            border-left: 1px dashed #cbd5e1 !important;
            height: 53.98mm !important;
            z-index: 50 !important;
          }
          
          /* Manter cantos arredondados na impressão */
          .shadow-2xl, .shadow-lg { box-shadow: none !important; }
          .rounded-3xl { border: none !important; }
          
          /* Forçar dimensões exatas */
          .w-\[85\.6mm\] { width: 85.6mm !important; min-width: 85.6mm !important; }
          .h-\[53\.98mm\] { height: 53.98mm !important; min-height: 53.98mm !important; }
        }
      `}} />
    </div>
  );
}
