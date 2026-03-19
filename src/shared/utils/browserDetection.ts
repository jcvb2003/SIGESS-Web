export function isFirefox(): boolean {
  return navigator.userAgent.toLowerCase().includes("firefox");
}
export function handleExternalLogin(
  url: string,
  cpf?: string,
  senha?: string,
): void {
  if (!cpf || !senha) {
    window.open(url, "_blank");
    return;
  }
  if (!isFirefox()) {
    window.open(url, "_blank");
    return;
  }
  try {
    window.postMessage(
      {
        type: "abrirAbaContainer",
        url,
        cpf,
        senha,
      },
      "*",
    );
  } catch {
    const hash = `#cpf=${encodeURIComponent(cpf)}&senha=${encodeURIComponent(senha)}`;
    window.open(url + hash, "_blank");
  }
}
