import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { SystemParameters } from "../../types/settings.types";
interface PublicationSectionProps {
  parameters: SystemParameters;
}
export function PublicationSection({ parameters }: PublicationSectionProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">
          Publicação Oficial e Área de Pesca
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="publication-number">Número da publicação</Label>
            <Input
              id="publication-number"
              name="publicationNumber"
              placeholder="0000"
              defaultValue={parameters?.publicationNumber ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publication-date">Data da publicação</Label>
            <div className="relative">
              <Input
                id="publication-date"
                name="publicationDate"
                type="date"
                defaultValue={parameters?.publicationDate ?? ""}
                className="pr-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4"
              />
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="publication-local">
              Local da pesca
            </Label>
            <Input
              id="publication-local"
              name="publicationLocal"
              placeholder="Rio, Lago, etc."
              defaultValue={parameters?.publicationLocal ?? ""}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fishing-area">Área de pesca</Label>
          <Input
            id="fishing-area"
            name="fishingArea"
            placeholder="Ex.: Águas interiores da região de ..."
            defaultValue={parameters?.fishingArea ?? ""}
          />
        </div>
      </CardContent>
    </Card>
  );
}
