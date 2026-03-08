import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface MemberBasicInfoCellProps {
  name: string | null;
  code: string | null;
  photoUrl?: string | null;
  isLoading?: boolean;
}

const getInitials = (name: string | null) => {
  if (!name) {
    return "?";
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return `${first}${last}`.toUpperCase();
};

export function MemberBasicInfoCell({ 
  name, 
  code, 
  photoUrl, 
  isLoading 
}: Readonly<MemberBasicInfoCellProps>) {
  return (
    <div className="flex items-center gap-2 md:gap-3">
      <Avatar className="hidden md:flex h-10 w-10 border border-border overflow-hidden bg-muted/30">
        {photoUrl && <AvatarImage src={photoUrl} alt={name || "Sócio"} className="object-cover" />}
        <AvatarFallback className="bg-primary/5 text-primary text-xs font-medium">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin opacity-50" />
          ) : (
            getInitials(name)
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-xs md:text-sm truncate">
          {name || "Sem nome"}
        </span>
        <span className="hidden md:block text-[10px] md:text-xs text-muted-foreground truncate opacity-70">
          {code ? `Matrícula: ${code}` : "Matrícula não informada"}
        </span>
      </div>
    </div>
  );
}
