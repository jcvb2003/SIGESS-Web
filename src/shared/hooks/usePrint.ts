import { useCallback } from "react";

/**
 * Hook universal para disparar impressões de forma isolada e limpa.
 * Cria um iframe temporário e oculto para renderizar o conteúdo e disparar o diálogo de impressão.
 */
export function usePrint() {
  const print = useCallback((elementId: string) => {
    const content = document.getElementById(elementId);
    if (!content) {
      console.error(`[usePrint] Element with id "${elementId}" not found.`);
      return;
    }

    // Criar iframe oculto
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.id = "print-iframe";

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    // Copiar estilos da página principal (opcional, mas bom para garantir consistência)
    // Para o SIGESS, focamos no conteúdo isolado que o PrintLayout já fornece
    const htmlHead = `
      <title>Impressão - SIGESS</title>
      ${Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
        .map(style => style.outerHTML)
        .join("")}
      <style>
        body { background: white !important; margin: 0; padding: 0; }
        @media print {
          .no-print { display: none !important; }
        }
      </style>
    `;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>${htmlHead}</head>
        <body>
          ${content.innerHTML}
          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
                window.parent.document.getElementById("print-iframe").remove();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  }, []);

  return { print };
}
