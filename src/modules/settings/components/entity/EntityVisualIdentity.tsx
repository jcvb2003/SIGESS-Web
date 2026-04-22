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
import { hexToHsl, hslToHex } from "@/shared/utils/colorConversion";
import { useColorPreview } from "../../hooks/useColorPreview";
import type { EntityFormData } from "../../hooks/useEntityValidation";
import { supabase } from "@/shared/lib/supabase/client";
import { toast } from "sonner";
import { ImagePlus, Trash2, Loader2, ImageIcon, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

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

interface ImageUploadFieldProps {
  readonly label: string;
  readonly description: string;
  readonly aspectRatio?: "square" | "video" | "auto";
}

function ImageUploadField({ label, description, aspectRatio = "auto" }: ImageUploadFieldProps) {
  const { setValue, watch } = useFormContext<EntityFormData>();
  const [isUploading, setIsUploading] = useState(false);
  const imageUrl = watch("logoUrl");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("branding")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("branding")
        .getPublicUrl(filePath);

      setValue("logoPath", filePath, { shouldDirty: true });
      setValue("logoUrl", publicUrl, { shouldDirty: true });
      toast.success(`${label} atualizado com sucesso!`);
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error(`Erro ao enviar o ${label.toLowerCase()}.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setValue("logoPath", "", { shouldDirty: true });
    setValue("logoUrl", "", { shouldDirty: true });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label className="text-sm font-semibold">{label}</Label>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>

      <div className="flex items-start gap-4">
        <div 
          className={cn(
            "relative group overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 transition-all hover:border-primary/50 flex items-center justify-center",
            aspectRatio === "square" ? "h-24 w-24" : "h-24 w-48"
          )}
        >
          {imageUrl ? (
            <>
              <img 
                src={imageUrl} 
                alt={label} 
                className="h-full w-full object-contain p-2"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRemove}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <>
                  <ImageIcon className="h-6 w-6 opacity-40" />
                  <span className="text-[10px]">Sem imagem</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="relative h-8 gap-2 overflow-hidden"
            disabled={isUploading}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {imageUrl ? "Alterar" : "Upload"}
            <input
              type="file"
              className="absolute inset-0 cursor-pointer opacity-0"
              accept="image/*"
              onChange={handleUpload}
            />
          </Button>
          {imageUrl && (
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-600" />
              Imagem pronta
            </span>
          )}
        </div>
      </div>
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
    <div className="grid gap-6">
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            Logotipos e Ícones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <ImageUploadField
            label="Logo Principal"
            description="Exibida na barra lateral e em documentos oficiais (PNG/JPG, máx 2MB)."
            aspectRatio="video"
          />
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Esquema de Cores</CardTitle>
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
    </div>
  );
}
