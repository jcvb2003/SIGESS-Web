import { Printer, IdCard, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { MemberRegistrationForm } from "../../types/member.types";

interface MemberPrintActionsProps {
  readonly member: MemberRegistrationForm;
}

export function MemberPrintActions({ member }: MemberPrintActionsProps) {
  const handleOpenReport = (type: "card" | "file") => {
    const path = type === "card" ? "carteirinha" : "ficha-socio";
    const url = `/${path}/${member.id}`;
    
    window.open(url, "_blank");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 gap-2 shadow-sm"
        >
          <Printer className="h-4 w-4" />
          <span className="font-semibold">Imprimir</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-1.5 border-border/50 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <DropdownMenuItem
          onClick={() => handleOpenReport("card")}
          className="flex items-center gap-2.5 py-2.5 px-3 cursor-pointer rounded-md transition-colors focus:bg-primary/5 focus:text-primary"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IdCard className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Carteirinha</span>
            <span className="text-[10px] text-muted-foreground">Versão para impressão</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleOpenReport("file")}
          className="flex items-center gap-2.5 py-2.5 px-3 cursor-pointer rounded-md transition-colors focus:bg-primary/10 focus:text-primary mt-1"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Ficha do Sócio</span>
            <span className="text-[10px] text-muted-foreground">Dados completos</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
