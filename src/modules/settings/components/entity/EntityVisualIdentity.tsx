import { useFormContext, useWatch } from "react-hook-form";
import { useCallback, useRef, useState } from "react";
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
import { BRANDING_COLORS, BRANDING_MAX_UPLOAD_BYTES } from "../../constants/brandingDefaults";
import { BRANDING_BUCKET } from "../../services/settingsService";
import { toast } from "sonner";
import { ImagePlus, Trash2, Loader2, ImageIcon, Camera, RotateCcw } from "lucide-react";
import { cn } from "@/shared/lib/utils";

// ─── ColorPickerField ─────────────────────────────────────────────────────────

interface ColorPickerFieldProps {
  readonly name: "corPrimaria" | "corSidebar";
  readonly label: string;
  readonly description: string;
}

function ColorPickerField({ name, label, description }: ColorPickerFieldProps) {
  const { setValue } = useFormContext<EntityFormData>();
  const hslValue = useWatch<EntityFormData>({ name }) as string | undefined;
  const hexValue = hslValue ? hslToHex(hslValue) : "#059669";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(name, hexToHsl(e.target.value), { shouldDirty: true });
    },
    [name, setValue],
  );

  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        id={`color-picker-${name}`}
        value={hexValue}
        onChange={handleChange}
        className="h-9 w-12 cursor-pointer rounded-md border border-border/50 bg-transparent p-0.5 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
        aria-label={label}
      />
      <div className="flex flex-col min-w-0">
        <Label htmlFor={`color-picker-${name}`} className="text-sm font-medium">
          {label}
        </Label>
        <span className="text-xs text-muted-foreground truncate">{description}</span>
      </div>
      <div
        className="ml-auto h-7 w-7 shrink-0 rounded-full border border-border/30 shadow-inner"
        style={{ backgroundColor: `hsl(${hslValue ?? BRANDING_COLORS.primary})` }}
        aria-hidden="true"
      />
    </div>
  );
}

// ─── LogoUploadField ──────────────────────────────────────────────────────────

function LogoUploadField() {
  const { setValue, watch } = useFormContext<EntityFormData>();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUrl = watch("logoUrl");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida.");
      return;
    }
    if (file.size > BRANDING_MAX_UPLOAD_BYTES) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    const oldPath = watch("logoPath");
    try {
      setIsUploading(true);
      if (oldPath) await supabase.storage.from(BRANDING_BUCKET).remove([oldPath]);

      const fileExt = file.name.split(".").pop();
      const filePath = `logo-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from(BRANDING_BUCKET).upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(BRANDING_BUCKET).getPublicUrl(filePath);
      setValue("logoPath", filePath, { shouldDirty: true });
      setValue("logoUrl", publicUrl, { shouldDirty: true });
      toast.success("Logo atualizado com sucesso!");
    } catch {
      toast.error("Erro ao enviar o logo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const oldPath = watch("logoPath");
    if (oldPath) {
      try { await supabase.storage.from(BRANDING_BUCKET).remove([oldPath]); } catch { /* ignore */ }
    }
    setValue("logoPath", "", { shouldDirty: true });
    setValue("logoUrl", "", { shouldDirty: true });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Área clicável — abre seletor de arquivo */}
      <button
        type="button"
        className={cn(
          "relative group w-full overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 transition-all hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "flex items-center justify-center",
          imageUrl ? "h-28" : "h-28"
        )}
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        title={imageUrl ? "Alterar logo" : "Enviar logo"}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : imageUrl ? (
          <>
            <img src={imageUrl} alt="Logo" className="h-full w-full object-contain p-3" />
            {/* Overlay com câmera + remover */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10"
              title="Remover logo"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground/60">
            <ImagePlus className="h-7 w-7" />
            <span className="text-[11px] font-medium">Clique para enviar</span>
            <span className="text-[10px]">PNG/JPG · máx 2MB</span>
          </div>
        )}
      </button>

      {imageUrl && (
        <span className="text-[10px] text-success font-medium flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Logo configurado
        </span>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleUpload}
      />
    </div>
  );
}

// ─── EntityVisualIdentity ─────────────────────────────────────────────────────

export function EntityVisualIdentity() {
  const { setValue } = useFormContext<EntityFormData>();
  useColorPreview();

  const handleResetColors = () => {
    setValue("corPrimaria", BRANDING_COLORS.primary, { shouldDirty: true });
    setValue("corSidebar", BRANDING_COLORS.primary, { shouldDirty: true });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Logotipos e Ícones */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            Logotipos e Ícones
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Exibida na barra lateral e em documentos oficiais.
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <LogoUploadField />
        </CardContent>
      </Card>

      {/* Esquema de Cores */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/30 pb-3 flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-bold">Esquema de Cores</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personalize a identidade visual da entidade.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetColors}
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
          >
            <RotateCcw className="h-3 w-3" />
            Padrão
          </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <ColorPickerField
            name="corPrimaria"
            label="Cor Primária"
            description="Botões, links e destaques"
          />
          <ColorPickerField
            name="corSidebar"
            label="Cor do Menu"
            description="Fundo do menu lateral"
          />
        </CardContent>
      </Card>
    </div>
  );
}
