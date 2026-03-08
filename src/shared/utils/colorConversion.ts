/**
 * Utilitários de conversão de cores entre HEX e HSL.
 *
 * O sistema salva cores no banco em formato HSL sem prefixo: "160 84% 39%"
 * O <input type="color"> trabalha com HEX: "#059669"
 *
 * Essas funções fazem a ponte entre os dois formatos,
 * usadas exclusivamente no formulário de color picker.
 */

/**
 * Converte HEX (#RRGGBB) para HSL string ("H S% L%").
 * Retorna o formato usado nas CSS variables do projeto.
 */
export function hexToHsl(hex: string): string {
  const sanitized = hex.replace("#", "");
  const r = Number.parseInt(sanitized.substring(0, 2), 16) / 255;
  const g = Number.parseInt(sanitized.substring(2, 4), 16) / 255;
  const b = Number.parseInt(sanitized.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    // Achromátic
    return `0 0% ${Math.round(l * 100)}%`;
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Converte HSL string ("H S% L%") para HEX (#RRGGBB).
 * Aceita o formato sem prefixo usado nas CSS variables.
 */
export function hslToHex(hslString: string): string {
  const parts = hslString.trim().split(/\s+/);
  if (parts.length < 3) return "#000000";

  const h = Number.parseFloat(parts[0]) / 360;
  const s = Number.parseFloat(parts[1].replace("%", "")) / 100;
  const l = Number.parseFloat(parts[2].replace("%", "")) / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return `#${val.toString(16).padStart(2, "0").repeat(3)}`;
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Valida se uma string está no formato HSL esperado ("H S% L%").
 */
export function isValidHslString(value: string): boolean {
  const parts = value.trim().split(/\s+/);
  if (parts.length < 3) return false;

  const h = Number.parseFloat(parts[0]);
  const s = Number.parseFloat(parts[1].replace("%", ""));
  const l = Number.parseFloat(parts[2].replace("%", ""));

  return (
    !Number.isNaN(h) && h >= 0 && h <= 360 &&
    !Number.isNaN(s) && s >= 0 && s <= 100 &&
    !Number.isNaN(l) && l >= 0 && l <= 100
  );
}

/**
 * Analisa a luminância de uma cor HSL e retorna a cor de texto (foreground)
 * ideal para manter o contraste legível e acessível (WCAG).
 * 
 * Retorna "210 40% 98%" (Branco) para fundos escuros.
 * Retorna "240 5.9% 10%" (Escuro) para fundos claros.
 */
export function generateAccessibleForeground(hslString: string): string {
  if (!isValidHslString(hslString)) return "210 40% 98%";

  // Para calcular a percepção visual precisa (Luminância relativa WCAG), 
  // precisamos converter HSL para RGB. Como já temos hslToHex:
  const hex = hslToHex(hslString);
  const r = Number.parseInt(hex.substring(1, 3), 16) / 255;
  const g = Number.parseInt(hex.substring(3, 5), 16) / 255;
  const b = Number.parseInt(hex.substring(5, 7), 16) / 255;

  // Lineariza e calcula a luminância relativa
  const toLinear = (c: number) => 
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  
  const luminance = 
    0.2126 * toLinear(r) + 
    0.7152 * toLinear(g) + 
    0.0722 * toLinear(b);

  // Ponto de quebra ajustado para 0.45 para garantir que 
  // cores intermediárias/vivas (como o verde original do SIGESS) 
  // recebam texto Branco, respeitando a identidade visual original.
  return luminance > 0.45 ? "240 5.9% 10%" : "210 40% 98%";
}
