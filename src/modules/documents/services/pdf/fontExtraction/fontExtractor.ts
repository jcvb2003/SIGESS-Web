import { PDFDocument, PDFName, PDFDict, PDFTextField } from "pdf-lib";
export interface FontConfiguration {
  fontName: string;
  fontSize: number;
  fontColor: string;
  alignment: "left" | "center" | "right";
}
export interface FieldFontConfig {
  fieldName: string;
  fontConfig: FontConfiguration;
}
type PDFFieldDict = PDFDict;
type PDFFieldWithInternalDict = PDFTextField & {
  acroField?: {
    dict?: PDFDict;
  };
  dict?: PDFDict;
};
class PdfFontExtractor {
  private getFieldDict(field: PDFTextField): PDFFieldDict | null {
    try {
      const fieldWithDict = field as PDFFieldWithInternalDict;
      return fieldWithDict.acroField?.dict || fieldWithDict.dict || null;
    } catch {
      return null;
    }
  }
  private getDefaultAppearance(dict: PDFFieldDict): string | null {
    try {
      const da = dict?.get?.(PDFName.of("DA"));
      if (da && typeof da === "object" && "decodeText" in da) {
        const decoded = da as {
          decodeText: () => string;
        };
        return decoded.decodeText() || null;
      }
      return da?.toString() || null;
    } catch {
      return null;
    }
  }
  private readonly fontConfigCache = new Map<string, FontConfiguration>();
  private readonly fieldConfigCache = new Map<string, FieldFontConfig>();
  public clearCache(): void {
    this.fontConfigCache.clear();
    this.fieldConfigCache.clear();
    this.log("Cache de configurações de fonte limpo");
  }
  private generateCacheKey(field: PDFTextField): string {
    try {
      const dict = this.getFieldDict(field);
      if (!dict) {
        return `fallback_${Date.now()}_${Math.random()}`;
      }
      const da = this.getDefaultAppearance(dict);
      const quadding = dict?.get?.(PDFName.of("Q"));
      return `${da || "no-da"}_${quadding || "no-q"}`;
    } catch {
      return `fallback_${Date.now()}_${Math.random()}`;
    }
  }
  private isDevelopment(): boolean {
    return (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === undefined
    );
  }
  private log(...args: unknown[]): void {
    if (this.isDevelopment()) {
      console.log("[PdfFontExtractor]", ...args);
    }
  }
  private warn(...args: unknown[]): void {
    if (this.isDevelopment()) {
      console.warn("[PdfFontExtractor]", ...args);
    } else {
      console.warn(...args);
    }
  }
  private validateFontName(fontName: string): string {
    if (
      !fontName ||
      typeof fontName !== "string" ||
      fontName.trim().length === 0
    ) {
      this.warn("Nome da fonte inválido, usando helvetica como padrão");
      return "helvetica";
    }
    const cleanFontName = fontName
      .toLowerCase()
      .trim()
      .replaceAll(/[^a-z0-9\-_]/g, "");
    if (cleanFontName.length === 0) {
      this.warn(
        "Nome da fonte vazio após limpeza, usando helvetica como padrão",
      );
      return "helvetica";
    }
    return cleanFontName;
  }
  private validateFontSize(fontSize: number): number {
    if (typeof fontSize !== "number" || Number.isNaN(fontSize) || fontSize <= 0) {
      this.warn("Tamanho da fonte inválido, usando 12 como padrão");
      return 12;
    }
    if (fontSize < 6) {
      this.warn("Tamanho da fonte muito pequeno, ajustando para 6pt");
      return 6;
    }
    if (fontSize > 72) {
      this.warn("Tamanho da fonte muito grande, ajustando para 72pt");
      return 72;
    }
    return fontSize;
  }
  private validateAlignment(alignment: string): string {
    const validAlignments = ["left", "center", "right"];
    if (
      !alignment ||
      typeof alignment !== "string" ||
      !validAlignments.includes(alignment.toLowerCase())
    ) {
      this.warn("Alinhamento inválido, usando left como padrão");
      return "left";
    }
    return alignment.toLowerCase();
  }
  async extractAvailableFonts(pdfBytes: ArrayBuffer): Promise<string[]> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes, {
        updateMetadata: false,
        ignoreEncryption: true,
      });
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      const fontNames = new Set<string>();
      this.log("Extraindo fontes dos campos do formulário...");
      for (const field of fields) {
        try {
          if (!(field instanceof PDFTextField)) {
            continue;
          }
          const fontName = this.extractFontName(field);
          if (fontName) {
            this.log("Fonte encontrada no campo:", fontName);
            fontNames.add(fontName);
          }
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "erro desconhecido";
          this.warn(
            `Aviso: Não foi possível extrair fonte do campo ${field.getName()}. ${message}`,
          );
          continue;
        }
      }
      if (fontNames.size === 0) {
        this.log("Nenhuma fonte específica encontrada, usando fontes padrão");
        fontNames.add("Helvetica");
        fontNames.add("Times-Roman");
        fontNames.add("Courier");
      }
      this.log("Fontes encontradas:", [...fontNames]);
      return [...fontNames].sort((a, b) => a.localeCompare(b));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "erro desconhecido";
      this.warn(`Erro ao processar o PDF com pdf-lib: ${message}`);
      return [];
    }
  }
  async extractFieldFontConfigurations(pdfBytes: ArrayBuffer): Promise<{
    availableFonts: string[];
    fieldConfigurations: FieldFontConfig[];
  }> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      const availableFonts = await this.extractAvailableFonts(pdfBytes);
      const fieldConfigurations: FieldFontConfig[] = [];
      this.log(`Extraindo configurações de ${fields.length} campos`);
      for (const field of fields) {
        try {
          const fieldName = field.getName();
          let textField = null;
          try {
            textField = form.getTextField(fieldName);
          } catch {
            continue;
          }
          if (textField) {
            const cacheKey = this.generateCacheKey(textField);
            let config = this.fieldConfigCache.get(cacheKey);
            if (config) {
              this.log(
                `Configuração encontrada no cache para campo: ${fieldName}`,
              );
              config = { ...config, fieldName };
            } else {
              const fontName = this.extractFontName(textField);
              const fontSize = this.extractFontSize(textField);
              const fontColor = this.extractFontColor();
              const alignment = this.extractAlignment(textField);
              config = {
                fieldName,
                fontConfig: {
                  fontName: fontName || "Helvetica",
                  fontSize: fontSize || 12,
                  fontColor: fontColor || "#000000",
                  alignment:
                    (alignment as "left" | "center" | "right") || "left",
                },
              };
              this.fieldConfigCache.set(cacheKey, config);
              this.log(
                `Configuração armazenada no cache para campo: ${fieldName}`,
              );
            }
            fieldConfigurations.push(config);
            this.log(
              `Configuração extraída para ${fieldName}:`,
              config.fontConfig,
            );
          }
        } catch (error) {
          this.warn(`Erro ao processar campo ${field.getName()}:`, error);
        }
      }
      this.log(
        `Total de configurações extraídas: ${fieldConfigurations.length}`,
      );
      return {
        availableFonts,
        fieldConfigurations,
      };
    } catch (error) {
      console.error("Erro ao extrair configurações de fonte:", error);
      return {
        availableFonts: [],
        fieldConfigurations: [],
      };
    }
  }
  private extractFontName(field: PDFTextField): string {
    const dict = this.getFieldDict(field);
    if (!dict) {
      this.warn("Não foi possível acessar o dicionário do campo");
      return this.validateFontName("");
    }
    const defaultAppearance = this.getDefaultAppearance(dict);
    if (!defaultAppearance) {
      this.warn("Default Appearance não encontrado");
      return this.validateFontName("");
    }
    const fontMatch = /\/(\w+)\s+[\d.]+\s+Tf/.exec(defaultAppearance);
    if (fontMatch?.[1]) {
      const extractedFont = fontMatch[1];
      this.log(`Nome da fonte extraído: ${extractedFont}`);
      return this.validateFontName(extractedFont);
    }
    this.warn("Nome da fonte não encontrado no Default Appearance");
    return this.validateFontName("");
  }
  private extractFontSize(field: PDFTextField): number {
    const dict = this.getFieldDict(field);
    if (!dict) {
      this.warn("Não foi possível acessar o dicionário do campo");
      return this.validateFontSize(12);
    }
    const defaultAppearance = this.getDefaultAppearance(dict);
    if (!defaultAppearance) {
      this.warn("Default Appearance não encontrado");
      return this.validateFontSize(12);
    }
    const sizeMatch = /\/\w+\s+([\d.]+)\s+Tf/.exec(defaultAppearance);
    if (sizeMatch?.[1]) {
      const extractedSize = Number.parseFloat(sizeMatch[1]);
      this.log(`Tamanho da fonte extraído: ${extractedSize}`);
      return this.validateFontSize(extractedSize);
    }
    this.warn("Tamanho da fonte não encontrado no Default Appearance");
    return this.validateFontSize(12);
  }
  private extractFontColor(): string | null {
    this.log("Usando cor padrão (processamento de cor simplificado)");
    return "#000000";
  }
  private extractAlignment(field: PDFTextField): string {
    const dict = this.getFieldDict(field);
    if (!dict) {
      this.warn("Não foi possível acessar o dicionário do campo");
      return this.validateAlignment("left");
    }
    try {
      const quadding = dict.get?.(PDFName.of("Q"));
      if (quadding !== undefined) {
        const qValue =
          typeof quadding === "number"
            ? quadding
            : Number.parseInt(quadding.toString(), 10);
        let alignment: string;
        switch (qValue) {
          case 0:
            alignment = "left";
            break;
          case 1:
            alignment = "center";
            break;
          case 2:
            alignment = "right";
            break;
          default:
            alignment = "left";
            break;
        }
        return this.validateAlignment(alignment);
      }
    } catch (error) {
      this.warn("Erro ao extrair alinhamento:", error);
    }
    return this.validateAlignment("left");
  }
}
export const pdfFontExtractor = new PdfFontExtractor();
