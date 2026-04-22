import React from "react";
import { useEntityData } from "@/shared/hooks/useEntityData";
import { cn } from "@/shared/lib/utils";
import { Fish } from "lucide-react";

interface PrintLayoutProps {
  id?: string;
  children: React.ReactNode;
  type?: "thermal" | "standard";
  showLogo?: boolean;
  showEntityInfo?: boolean;
  className?: string;
}

export const PrintLayout = React.forwardRef<HTMLDivElement, PrintLayoutProps>(
  ({ id, children, type = "standard", showLogo = true, showEntityInfo = true, className }, ref) => {
    const { entity } = useEntityData();

    return (
      <div
        ref={ref}
        id={id}
        className={cn(
          "bg-white text-black",
          type === "thermal" ? "w-full max-w-[500px] p-4 text-[10pt] mx-auto" : "w-full p-8 text-sm",
          className
        )}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            @page { 
              margin: 0; 
              size: ${type === "thermal" ? "80mm auto" : "auto"};
            }
            body, #receipt-content { margin: 0 !important; padding: 0 !important; width: 80mm !important; }
          }
        `}} />

        {(showLogo || showEntityInfo) && (
          <header className={cn(
            "flex flex-col items-center text-center border-b-2 border-black pb-4 mb-6 w-full",
            type === "thermal" && "pb-1 mb-2"
          )}>
            {showLogo && (
              <div className="mb-1">
                {entity?.logoUrl ? (
                  <img src={entity.logoUrl} alt="Logo" className={cn(
                    "object-contain logo-multiply",
                    type === "thermal" ? "h-12 w-auto" : "h-16 w-auto"
                  )} />
                ) : (
                  <div className={cn(
                    "flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-200",
                    type === "thermal" ? "h-10 w-10" : "h-14 w-14"
                  )}>
                    <Fish className={type === "thermal" ? "h-5 w-5" : "h-8 w-8"} />
                  </div>
                )}
              </div>
            )}

            {showEntityInfo && (
              <div className="space-y-1">
                <h1 className={cn(
                  "font-black uppercase tracking-tight leading-none",
                  type === "thermal" ? "text-base" : "text-2xl"
                )}>
                  {entity?.name || "SIGESS"}
                </h1>
                {entity?.cnpj && (
                  <p className="text-[10px] font-bold opacity-70">CNPJ: {entity.cnpj}</p>
                )}
                <p className={cn(
                  "opacity-60 leading-tight",
                  type === "thermal" ? "text-[8pt] max-w-[200px]" : "text-xs"
                )}>
                  {entity?.street && `${entity.street}, ${entity.number} - ${entity.district}`}
                  <br />
                  {entity?.city && `${entity.city}/${entity.state} - CEP: ${entity.cep}`}
                </p>
              </div>
            )}
          </header>
        )}

        <main>{children}</main>

        <footer className={cn(
          "mt-8 pt-4 border-t border-dashed border-slate-300 text-center text-slate-400",
          type === "thermal" && "mt-4 pt-2 text-[7pt]"
        )}>
          <p className="font-bold">SIGESS - Sistema de Gestão de Entidades</p>
          <p>Documento gerado em {new Date().toLocaleString("pt-BR")}</p>
        </footer>
      </div>
    );
  }
);

PrintLayout.displayName = "PrintLayout";
