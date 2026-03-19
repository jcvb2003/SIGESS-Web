import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
interface MemberBasicInfoCellProps {
  name: string | null;
  code: string | null;
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
export function MemberBasicInfoCell({ name, code }: MemberBasicInfoCellProps) {
  return (
    <div className="flex items-center gap-2 md:gap-3">
      <Avatar className="hidden md:flex h-10 w-10 border border-border">
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-medium text-xs md:text-sm">
          {name || "Sem nome"}
        </span>
        <span className="hidden md:block text-[10px] md:text-xs text-muted-foreground">
          {code ? `Matrícula: ${code}` : "Matrícula não informada"}
        </span>
      </div>
    </div>
  );
}
