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
interface FishingPeriodsSectionProps {
  parameters: SystemParameters;
}
export function FishingPeriodsSection({
  parameters,
}: FishingPeriodsSectionProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Períodos de Defeso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="defeso-1-start">Início do 1º período</Label>
            <div className="relative">
              <Input
                id="defeso-1-start"
                name="defeso1Start"
                type="date"
                defaultValue={parameters?.defeso1Start ?? ""}
                className="pr-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4"
              />
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="defeso-1-end">Fim do 1º período</Label>
            <div className="relative">
              <Input
                id="defeso-1-end"
                name="defeso1End"
                type="date"
                defaultValue={parameters?.defeso1End ?? ""}
                className="pr-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4"
              />
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="defeso-2-start">Início do 2º período</Label>
            <div className="relative">
              <Input
                id="defeso-2-start"
                name="defeso2Start"
                type="date"
                defaultValue={parameters?.defeso2Start ?? ""}
                className="pr-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4"
              />
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="defeso-2-end">Fim do 2º período</Label>
            <div className="relative">
              <Input
                id="defeso-2-end"
                name="defeso2End"
                type="date"
                defaultValue={parameters?.defeso2End ?? ""}
                className="pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="defeso-species">Espécies abrangidas</Label>
          <Input
            id="defeso-species"
            name="defesoSpecies"
            placeholder="Lista de espécies em defeso"
            defaultValue={parameters?.defesoSpecies ?? ""}
          />
        </div>
      </CardContent>
    </Card>
  );
}
