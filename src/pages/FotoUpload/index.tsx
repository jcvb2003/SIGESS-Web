import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { initSupabaseClient } from "@/shared/lib/supabase/client";
import { Camera, ImagePlus, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Scanner } from "@yudiel/react-qr-scanner";
import { toast } from "sonner";

export default function FotoUploadPage() {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get("t");
  const initialTenant = searchParams.get("tenant");
  
  const [token, setToken] = useState<string | null>(initialToken);
  const [tenant, setTenant] = useState<string | null>(initialTenant);

  const hasValidLink = token && tenant;

  const [status, setStatus] = useState<"scanning" | "idle" | "capturing" | "confirming" | "uploading" | "success" | "error">(
    hasValidLink ? "idle" : "scanning"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isScannerActive, setIsScannerActive] = useState(true);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Bloqueio explícito de HEIC/HEIF e validação estrita
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".heic") || fileName.endsWith(".heif") || fileName.endsWith(".hevc")) {
      toast.error("Formato Apple HEIC não suportado nativamente. Tire a foto novamente pela opção de Câmera 3x4.", { duration: 5000 });
      // Resetar o input
      e.target.value = "";
      return;
    }

    if (file.type && !file.type.match(/image\/(jpeg|png|jpg)/i)) {
      toast.error("Selecione apenas formato de imagem JPEG ou PNG.", { duration: 4000 });
      e.target.value = "";
      return;
    }

    setStatus("uploading");
    try {
      const img = new Image();

      img.onload = async () => {
        // 2. Criar canvas para o crop 3x4
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not get canvas context");

          // Resolução alvo 3x4 (600x800 para boa qualidade sem ser pesado)
          const targetWidth = 600;
          const targetHeight = 800;
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // Cálculo do crop centralizado
          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = img.width;
          let sourceHeight = img.height;

          const targetRatio = targetWidth / targetHeight;
          const sourceRatio = img.width / img.height;

          if (sourceRatio > targetRatio) {
            sourceWidth = img.height * targetRatio;
            sourceX = (img.width - sourceWidth) / 2;
          } else {
            sourceHeight = img.width / targetRatio;
            sourceY = (img.height - sourceHeight) / 2;
          }

          ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

          // 3. Converter para Base64 (JPEG 0.7)
          const base64Photo = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];

          // 4. Enviar via RPC
          const supabase = initSupabaseClient(tenant!);
          
          /* eslint-disable @typescript-eslint/no-explicit-any */
          const { data, error } = await (supabase as any).rpc("confirmar_upload_foto", {
            p_token: token,
            p_base64: base64Photo,
          });
          /* eslint-enable @typescript-eslint/no-explicit-any */

          if (error || !data) {
            throw new Error(error?.message || "Erro no servidor ao salvar foto.");
          }

          setStatus("success");
          toast.success("Foto enviada com sucesso!");
        } catch (error: unknown) {
          console.error("Erro interno ao processar/salvar a foto:", error);
          setStatus("error");
          setErrorMessage("Erro ao salvar foto: " + (error instanceof Error ? error.message : "Desconhecido"));
        } finally {
          URL.revokeObjectURL(img.src);
        }
      };
      img.onerror = () => {
        setStatus("error");
        setErrorMessage("O arquivo selecionado não é uma imagem válida ou está corrompido.");
        URL.revokeObjectURL(img.src);
      };

      // Iniciar carregamento
      img.src = URL.createObjectURL(file);
    } catch (error: unknown) {
      console.error("Erro ao iniciar captura:", error);
      setStatus("error");
      setErrorMessage("Erro ao iniciar o processo de foto.");
      toast.error("Falha no envio");
    }
  };

  const triggerCameraInput = () => {
    cameraInputRef.current?.click();
  };

  const triggerGalleryInput = () => {
    galleryInputRef.current?.click();
  };

  if (status === "success") {
    return (
      <div 
        className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-4 font-sans"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Envio Concluído!</h1>
        <p className="text-slate-500 mb-8 max-w-[280px] text-center">
          Agora você pode voltar para a tela do computador. A foto vai aparecer lá automaticamente.
        </p>
        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold italic mb-8">SIGESS MOBILE</div>
        
        <Button 
          size="lg" 
          variant="outline"
          className="rounded-xl border-slate-200 text-slate-600 font-bold"
          onClick={() => {
            setToken(null);
            setTenant(null);
            setStatus("scanning");
          }}
        >
          Ler Próximo QR Code
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Ops! Algo deu errado</h1>
        <p className="text-slate-500 mb-8 max-w-[280px]">{errorMessage}</p>
        <Button onClick={() => globalThis.location.reload()} variant="outline">Tentar novamente</Button>
      </div>
    );
  }

  if (status === "scanning") {
    return (
      <div className="min-h-[100dvh] bg-slate-900 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute top-8 text-center px-4 w-full z-10 flex flex-col items-center">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 border border-white/20 shadow-xl">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2 tracking-tight">Terminal de Captura</h1>
          <p className="text-slate-400 text-sm max-w-[280px]">
            Aponte a câmera para o QR Code gerado no cadastro do sócio (no computador)
          </p>
        </div>
        
        <div className="w-full max-w-sm aspect-square rounded-[2rem] overflow-hidden shadow-2xl ring-4 ring-primary/40 bg-black relative mt-16 z-20 flex items-center justify-center">
          {isScannerActive ? (
            <Scanner 
              onScan={(result) => {
                try {
                  let text = "";
                  // Handle different library versions (string vs array of objects)
                  if (typeof result === "string") text = result;
                  else if (Array.isArray(result) && result.length > 0 && result[0].rawValue) text = result[0].rawValue;
                  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                  else if (result && (result as any).text) text = (result as any).text;

                  if (text) {
                    const url = new URL(text);
                    const scannedToken = url.searchParams.get("t");
                    const scannedTenant = url.searchParams.get("tenant");
                    
                    if (scannedToken && scannedTenant) {
                      setToken(scannedToken);
                      setTenant(scannedTenant);
                      setStatus("idle");
                      toast.success("Foto liberada! Câmera pronta.");
                    }
                  }
                } catch {
                  // Ignore random strings/barcodes
                }
              }}
              onError={(error: unknown) => {
                console.error("Scanner Error", error);
                const e = error as Error;
                if (e?.message?.includes("NotAllowedError") || e?.message?.includes("secure context")) {
                  setErrorMessage("A câmera foi bloqueada. Navegadores exigem conexão segura (HTTPS).");
                } else {
                  toast.error("Oops, a câmera falhou em iniciar.");
                }
              }}
              components={{
                zoom: false,
                finder: true
              }}
            />
          ) : (
            <div className="text-slate-500 flex flex-col items-center">
              <Camera className="w-12 h-12 mb-2 opacity-50" />
              <span>Câmera Desligada</span>
            </div>
          )}
        </div>
        
        <div className="mt-8 z-20">
          <Button 
            variant="outline" 
            className="rounded-xl border-white/20 text-white hover:bg-white/10 bg-transparent"
            onClick={() => setIsScannerActive(!isScannerActive)}
          >
            {isScannerActive ? "Desligar Câmera" : "Ligar Câmera"}
          </Button>
        </div>
        
        <div className="absolute bottom-8 text-center w-full px-8 z-10">
           <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold italic mb-4">SIGESS TERMINAL MODO</p>
           {errorMessage && (
             <p className="text-red-400 text-xs bg-red-900/30 p-2 rounded-md">{errorMessage}</p>
           )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-4 font-sans"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 pb-4 text-center">
          <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/10">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Foto do Sócio</h1>
          <p className="text-slate-500 text-sm">Tire uma foto 3x4 agora ou escolha uma da sua galeria.</p>
        </div>

        <div className="p-8 pt-4 flex flex-col gap-4">
          {/* Input 1: Força captura de câmera */}
          {/* O aviso sobre capture no input é um falso positivo do linter para Safari Desktop; funciona nativamente em iOS/Android */}
          <input
            type="file"
            ref={cameraInputRef}
            className="hidden"
            accept="image/jpeg, image/png, image/jpg"
            capture="environment"
            onChange={handleFileSelect}
            title="Tirar foto"
            aria-label="Tirar foto"
          />

          {/* Input 2: Abre a galeria padronizada (sem capture) */}
          <input
            type="file"
            ref={galleryInputRef}
            className="hidden"
            accept="image/jpeg, image/png, image/jpg"
            onChange={handleFileSelect}
            title="Selecionar foto da galeria"
            aria-label="Selecionar foto da galeria"
          />

          <Button 
            size="lg" 
            className="h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 gap-2"
            onClick={triggerCameraInput}
            disabled={status === "uploading"}
          >
            {status === "uploading" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Tirar Foto 3x4
              </>
            )}
          </Button>

          <Button 
            variant="outline" 
            size="lg" 
            className="h-14 rounded-2xl text-base font-semibold gap-2 border-slate-200"
            onClick={triggerGalleryInput}
            disabled={status === "uploading"}
          >
            <ImagePlus className="w-5 h-5 text-slate-400" />
            Escolher da Galeria
          </Button>
        </div>
        
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold italic">SIGESS MOBILE</p>
        </div>
      </div>
      
      <p className="text-slate-400 text-[11px] mt-8 max-w-[240px] text-center">
        O sistema recorta a foto automaticamente para o formato 3x4 (retrato).
      </p>
    </div>
  );
}
