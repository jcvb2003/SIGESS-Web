import { useFormContext, useWatch } from "react-hook-form";
import { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { ChevronDown } from "lucide-react";
import { hexToHsl, hslToHex } from "@/shared/utils/colorConversion";
import { useColorPreview } from "../../hooks/useColorPreview";
import type { EntityFormData } from "../../hooks/useEntityValidation";

interface ColorPickerFieldProps {
  readonly name: "corPrimaria" | "corSecundaria" | "corSidebar";
  readonly label: string;
  readonly description: string;
}

function ColorPickerField({ name, label, description }: ColorPickerFieldProps) {
  const { setValue } = useFormContext<EntityFormData>();
  const hslValue = useWatch<EntityFormData>({ name }) as string | undefined;

  const hexValue = hslValue ? hslToHex(hslValue) : "#059669";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newHsl = hexToHsl(e.target.value);
      setValue(name, newHsl, { shouldDirty: true });
    },
    [name, setValue],
  );

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <input
          type="color"
          id={`color-picker-${name}`}
          value={hexValue}
          onChange={handleChange}
          className="h-10 w-14 cursor-pointer rounded-md border border-border/50 bg-transparent p-0.5 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={label}
        />
      </div>
      <div className="flex flex-col">
        <Label
          htmlFor={`color-picker-${name}`}
          className="text-sm font-medium"
        >
          {label}
        </Label>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <div
        className="ml-auto h-8 w-8 rounded-full border border-border/30 shadow-inner"
        style={{ backgroundColor: `hsl(${hslValue ?? "160 84% 39%"})` }}
        aria-hidden="true"
      />
    </div>
  );
}

export function EntityVisualIdentity() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { setValue } = useFormContext<EntityFormData>();

  // Ativa o preview ao vivo
  useColorPreview();

  const handleResetColors = () => {
    setValue("corPrimaria", "160 84% 39%", { shouldDirty: true });
    setValue("corSecundaria", "152 69% 41%", { shouldDirty: true });
    setValue("corSidebar", "160 84% 39%", { shouldDirty: true });
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Identidade Visual</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetColors}
          className="text-xs"
        >
          Resetar Padrão
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <ColorPickerField
          name="corPrimaria"
          label="Cor Primária"
          description="Botões, links e destaques"
        />

        <ColorPickerField
          name="corSecundaria"
          label="Cor Secundária"
          description="Hover, accent e bordas ativas"
        />

        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-0 py-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowAdvanced((prev) => !prev)}
          >
            <ChevronDown
              className={`mr-1 h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            />
            Opções avançadas
          </Button>

          {showAdvanced && (
            <div className="mt-3">
              <ColorPickerField
                name="corSidebar"
                label="Cor do Sidebar"
                description="Fundo do menu lateral"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
