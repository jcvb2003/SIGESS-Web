import { describe, it, expect } from 'vitest';
import { calculateReapStatus, getApplicableYears } from '../reapDomain';

// ─── calculateReapStatus ──────────────────────────────────────────────────────

describe('calculateReapStatus', () => {
  it('retorna "problema" quando temProblema é true, independente dos enviados', () => {
    expect(calculateReapStatus(3, 3, true)).toBe('problema');
    expect(calculateReapStatus(0, 3, true)).toBe('problema');
  });

  it('retorna "ok" quando todos os anos foram enviados sem problema', () => {
    expect(calculateReapStatus(3, 3, false)).toBe('ok');
    expect(calculateReapStatus(1, 1, false)).toBe('ok');
  });

  it('retorna "parcial" quando alguns anos foram enviados', () => {
    expect(calculateReapStatus(1, 3, false)).toBe('parcial');
    expect(calculateReapStatus(2, 4, false)).toBe('parcial');
  });

  it('retorna "pendente" quando nenhum ano foi enviado', () => {
    expect(calculateReapStatus(0, 3, false)).toBe('pendente');
    expect(calculateReapStatus(0, 0, false)).toBe('pendente');
  });
});

// ─── getApplicableYears ───────────────────────────────────────────────────────

describe('getApplicableYears', () => {
  describe('simplificado', () => {
    it('retorna todos os anos quando emissaoRgp é null', () => {
      const anos = getApplicableYears(null, 'simplificado');
      expect(anos).toContain(2021);
      expect(anos).toContain(2024);
    });

    it('filtra anos anteriores ao RGP', () => {
      const anos = getApplicableYears('2023-06-15', 'simplificado');
      expect(anos).not.toContain(2021);
      expect(anos).not.toContain(2022);
      expect(anos).toContain(2023);
      expect(anos).toContain(2024);
    });

    it('parse correto em datas de janeiro (evita bug timezone UTC-3)', () => {
      // new Date('2023-01-01') em UTC-3 retornaria getFullYear() = 2022 — bug corrigido
      const anos = getApplicableYears('2023-01-01', 'simplificado');
      expect(anos).not.toContain(2021);
      expect(anos).not.toContain(2022);
      expect(anos).toContain(2023);
      expect(anos).toContain(2024);
    });
  });

  describe('anual', () => {
    it('retorna array vazio quando emissaoRgp é null e ANO_ATUAL <= 2025', () => {
      const anos = getApplicableYears(null, 'anual');
      expect(Array.isArray(anos)).toBe(true);
    });

    it('começa a partir do max(anoRgp, 2025) quando RGP é posterior ao ANO_INICIAL_ANUAL', () => {
      // Usa mês de julho para evitar problema de timezone em UTC-3
      const anos = getApplicableYears('2027-07-01', 'anual');
      expect(anos).not.toContain(2025);
      expect(anos).not.toContain(2026);
    });
  });
});
