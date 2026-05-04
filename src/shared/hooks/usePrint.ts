import { useCallback } from "react";

interface PrintOptions {
  rotated?: boolean;
}

export function usePrint() {
  const print = useCallback((elementId: string, options: PrintOptions = {}) => {
    const content = document.getElementById(elementId);
    if (!content) return;

    const { rotated = false } = options;

    document.getElementById("print-iframe")?.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "print-iframe";
    // Dimensões reais para garantir carregamento e layout (A4 retrato)
    iframe.style.cssText = "position:fixed;top:-9999px;left:0;width:210mm;height:297mm;border:0;";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const inheritedStyles = Array.from(
      document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>("link[rel='stylesheet'], style")
    ).map(s => s.outerHTML).join("\n");

    const innerHtml = content.innerHTML;

    // Abordagem CSS mais simples e robusta para rotação
    // #pw é a página A4.
    // #scale-wrapper é posicionado no canto superior direito (margem de 5mm) e rotacionado 90 graus.
    // Assim, a "largura" do recibo desce pela página, e a "altura" vai da direita para a esquerda.
    const printStyles = rotated ? `
      <style>
        @page { size: portrait; margin: 0; }
        html, body { margin:0; padding:0; background:white; }
        #pw { 
          position:relative; 
          width:210mm; 
          height:297mm; 
          overflow:hidden; 
        }
        /* Linha de corte na página */
        #pw::after {
          content: '------------------------------------------------------------------------------------------------------------------------------------------------';
          position: absolute;
          top: 95mm; /* 5mm margem + 90mm largura do recibo */
          left: 0;
          width: 100%;
          color: #94a3b8;
          font-size: 10px;
          letter-spacing: 2px;
          overflow: hidden;
          white-space: nowrap;
        }
        #scale-wrapper {
          position: absolute;
          top: 5mm; /* Margem superior */
          left: 205mm; /* Coloca a base da rotação na direita da folha retrato */
          transform: rotate(90deg);
          transform-origin: top left;
        }
        #pc {
          width: 90mm; /* Eixo curto do recibo (largura do DOM). Define a faixa vertical que ele ocupa na folha */
          filter:grayscale(1); -webkit-filter:grayscale(1);
          padding-right: 5mm; /* Evitar que o conteúdo encoste na linha de corte */
          box-sizing: border-box;
        }
        .no-print { display:none !important; }
      </style>
    ` : `
      <style>
        @page { size: portrait; margin: 5mm; }
        body { margin:0; padding:0; background:white; }
        #receipt-content { filter:grayscale(1); width:100%; max-width:none; }
        .no-print { display:none !important; }
      </style>
    `;

    const body = rotated
      ? `<div id="pw"><div id="scale-wrapper"><div id="pc">${innerHtml}</div></div></div>`
      : innerHtml;

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Impressão - SIGESS</title>
  ${inheritedStyles}
  ${printStyles}
  <style>body{background:white!important;}</style>
</head>
<body>${body}</body>
</html>`);
    doc.close();

    const win = iframe.contentWindow;
    if (!win) return;

    // Aguardar imagens e fontes carregarem antes de medir
    win.addEventListener("load", () => {
      setTimeout(() => {
        if (rotated) {
          const pc = win.document.getElementById("pc");
          const scaleWrapper = win.document.getElementById("scale-wrapper");
          
          if (pc && scaleWrapper) {
            // No modo rotacionado 90deg, a ALTURA do DOM cruza a LARGURA da página.
            const contentHeight = pc.getBoundingClientRect().height;
            
            // Largura disponível na folha retrato (200mm = 210mm - 10mm margens)
            const availableWidthPx = 200 * (96 / 25.4);
            
            // Se o comprovante for muito longo, encolhe para caber na largura da folha
            if (contentHeight > availableWidthPx) {
              const scale = availableWidthPx / contentHeight;
              scaleWrapper.style.transform = `rotate(90deg) scale(${scale})`;
            }
          }
        }

        setTimeout(() => {
          win.focus();
          win.print();
          setTimeout(() => iframe.remove(), 1500);
        }, 300);
      }, 500);
    });
  }, []);

  return { print };
}
