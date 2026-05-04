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
          "bg-background dark:bg-card text-foreground print:bg-white print:text-black",
          type === "thermal" ? "w-full max-w-[340px] p-1 text-[10pt] mx-auto" : "w-full p-8 text-sm",
          className
        )}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body { margin: 0 !important; padding: 0 !important; background: white !important; }
            .no-print { display: none !important; }
            @page {
              size: portrait;
              margin: 5mm;
            }
            #receipt-content {
              filter: grayscale(1) !important;
              -webkit-filter: grayscale(1) !important;
              width: 100% !important;
              max-width: none !important;
              padding: 0 !important;
            }
          }
        `}} />

        {(showLogo || showEntityInfo) && (
          <header className={cn(
            "flex flex-col items-center text-center border-b-2 border-border print:border-black pb-2 mb-2 w-full",
            type === "thermal" && "pb-1 mb-1"
          )}>
            {showLogo && (
              <div className="mb-1">
                {entity?.logoUrl ? (
                  <img src={entity.logoUrl} alt="Logo" className={cn(
                    "object-contain logo-multiply",
                    type === "thermal" ? "h-10 w-auto" : "h-16 w-auto"
                  )} />
                ) : (
                  <div className={cn(
                    "flex items-center justify-center rounded-xl bg-muted text-muted-foreground border border-border",
                    type === "thermal" ? "h-8 w-8" : "h-14 w-14"
                  )}>
                    <Fish className={type === "thermal" ? "h-4 w-4" : "h-8 w-8"} />
                  </div>
                )}
              </div>
            )}

            {showEntityInfo && (
              <div className="space-y-0.5">
                <h1 className={cn(
                  "font-bold uppercase leading-tight",
                  type === "thermal" ? "text-xs" : "text-lg"
                )}>
                  {entity?.name || "SIGESS"}
                </h1>
                {entity?.cnpj && (
                  <p className="text-[9px] font-medium opacity-70">CNPJ: {entity.cnpj}</p>
                )}
                <p className={cn(
                  "opacity-60 leading-tight",
                  type === "thermal" ? "text-[8px]" : "text-xs"
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
          "mt-3 text-center text-muted-foreground",
          type === "thermal" && "mt-1 text-[7px]"
        )}>
          <p>Gerado em {new Date().toLocaleString("pt-BR")}</p>
        </footer>
      </div>
    );
  }
);

PrintLayout.displayName = "PrintLayout";

