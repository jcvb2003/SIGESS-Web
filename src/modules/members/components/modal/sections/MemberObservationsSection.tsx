import { MemberRegistrationForm } from "../../../types/member.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { MessageSquare } from "lucide-react";
interface MemberObservationsSectionProps {
  member: MemberRegistrationForm;
}
export function MemberObservationsSection({
  member,
}: MemberObservationsSectionProps) {
  if (!member.observacoes) return null;
  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <MessageSquare className="h-4.5 w-4.5 text-primary/70" />
          Observações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-muted/50 border border-border/30 p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
            {member.observacoes}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
