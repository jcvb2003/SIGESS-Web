import {
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
interface ParametersFormHeaderProps {
  onSave?: () => void;
  isSaving?: boolean;
  isDisabled?: boolean;
}
export function ParametersFormHeader({
  onSave,
  isSaving,
  isDisabled,
}: ParametersFormHeaderProps) {
  return (
    <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <SettingsIcon className="h-4 w-4" />
        </div>
        <div>
          <CardTitle className="text-lg">
            Parâmetros de Defeso e Publicação
          </CardTitle>
          <CardDescription>
            Configure períodos de defeso, dados de publicação e área de pesca
            usados nos documentos.
          </CardDescription>
        </div>
      </div>
      <Button
        type="submit"
        onClick={onSave}
        className="mt-2 md:mt-0"
        disabled={isDisabled}
      >
        {isSaving ? "Salvando..." : "Salvar alterações"}
      </Button>
    </CardHeader>
  );
}
