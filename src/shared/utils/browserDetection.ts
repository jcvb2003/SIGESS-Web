import { toast } from "sonner";

export function isFirefox(): boolean {
  return navigator.userAgent.toLowerCase().includes("firefox");
}
export function handleExternalLogin(
  url: string,
  cpf?: string,
  senha?: string,
  nome?: string,
  auditoriaData?: Record<string, unknown>
): void {
  if (!cpf || !senha) {
    globalThis.open(url, "_blank");
    return;
  }
  if (!isFirefox()) {
    globalThis.open(url, "_blank");
    return;
  }
  try {
    globalThis.postMessage(
      {
        type: "abrirAbaContainer",
        url,
        cpf,
        senha,
        nome,
        auditoriaData,
      },
      globalThis.location.origin
    );
  } catch (error) {
    console.error("Falha na comunicação segura com a aba externa:", error);
    toast.error("Não foi possível realizar o login automático. Por favor, tente novamente ou use outro navegador.");
  }
}
