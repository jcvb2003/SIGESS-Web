import { Copy } from "lucide-react";
import { toast } from "sonner";
interface InfoItemProps {
  label: string;
  value: string | null | undefined;
  copiable?: boolean;
  copyLabel?: string;
}
export function InfoItem({ label, value, copiable, copyLabel }: InfoItemProps) {
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast.success(`${copyLabel ?? label} copiado para área de transferência!`);
  };
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium text-foreground break-words">
          {value || "—"}
        </p>
        {copiable && value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
            title={`Copiar ${copyLabel ?? label}`}
          >
            <Copy className="h-3 w-3" />
            <span className="sr-only">Copiar</span>
          </button>
        )}
      </div>
    </div>
  );
}
