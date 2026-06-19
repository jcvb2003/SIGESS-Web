import { describe, it, expect } from 'vitest';
import {
  getMembershipCompetencyContext,
  buildMonthStartDate,
  getMonthYearFromDate,
  getFirstRequiredMonthForYear,
  isMonthBeforeMembership,
} from '../membershipCompetency';

// ─── getMembershipCompetencyContext ──────────────────────────────────────────

describe('getMembershipCompetencyContext', () => {
  it('retorna nulls quando admissionDate é null', () => {
    expect(getMembershipCompetencyContext(null)).toEqual({
      admissionYear: null,
      admissionMonth: null,
    });
  });

  it('parseia data válida corretamente', () => {
    expect(getMembershipCompetencyContext('2023-06-15')).toEqual({
      admissionYear: 2023,
      admissionMonth: 6,
    });
  });

  it('parseia janeiro sem bug de timezone UTC-3 (usa split, não new Date)', () => {
    // new Date('2024-01-01') em UTC-3 retornaria getFullYear() = 2023 — aqui é seguro
    expect(getMembershipCompetencyContext('2024-01-01')).toEqual({
      admissionYear: 2024,
      admissionMonth: 1,
    });
  });

  it('parseia dezembro corretamente', () => {
    expect(getMembershipCompetencyContext('2023-12-01')).toEqual({
      admissionYear: 2023,
      admissionMonth: 12,
    });
  });

  it('retorna nulls para string inválida', () => {
    expect(getMembershipCompetencyContext('abc')).toEqual({
      admissionYear: null,
      admissionMonth: null,
    });
  });
});

// ─── buildMonthStartDate ──────────────────────────────────────────────────────

describe('buildMonthStartDate', () => {
  it('formata mês com zero à esquerda', () => {
    expect(buildMonthStartDate(2023, 6)).toBe('2023-06-01');
  });

  it('formata dezembro corretamente', () => {
    expect(buildMonthStartDate(2023, 12)).toBe('2023-12-01');
  });

  it('formata janeiro corretamente', () => {
    expect(buildMonthStartDate(2024, 1)).toBe('2024-01-01');
  });
});

// ─── getMonthYearFromDate ─────────────────────────────────────────────────────

describe('getMonthYearFromDate', () => {
  it('é alias de getMembershipCompetencyContext', () => {
    expect(getMonthYearFromDate('2023-05-10')).toEqual({
      admissionYear: 2023,
      admissionMonth: 5,
    });
  });
});

// ─── getFirstRequiredMonthForYear ─────────────────────────────────────────────

describe('getFirstRequiredMonthForYear', () => {
  it('retorna 1 quando admissionDate é null (sem restrição)', () => {
    expect(getFirstRequiredMonthForYear(2023, null)).toBe(1);
  });

  it('retorna 1 para ano posterior ao ano de admissão', () => {
    expect(getFirstRequiredMonthForYear(2024, '2023-05-01')).toBe(1);
  });

  it('retorna o mês de admissão para o mesmo ano', () => {
    expect(getFirstRequiredMonthForYear(2023, '2023-05-01')).toBe(5);
  });

  it('retorna 13 para ano anterior ao de admissão (bloqueia todos os meses)', () => {
    expect(getFirstRequiredMonthForYear(2022, '2023-05-01')).toBe(13);
  });

  it('admissão em janeiro no mesmo ano retorna 1', () => {
    expect(getFirstRequiredMonthForYear(2023, '2023-01-01')).toBe(1);
  });

  it('admissão em dezembro no mesmo ano retorna 12', () => {
    expect(getFirstRequiredMonthForYear(2023, '2023-12-01')).toBe(12);
  });
});

// ─── isMonthBeforeMembership ──────────────────────────────────────────────────

describe('isMonthBeforeMembership', () => {
  it('retorna true para mês anterior ao mês de admissão no mesmo ano', () => {
    expect(isMonthBeforeMembership(2023, 3, '2023-05-01')).toBe(true);
  });

  it('retorna false no mês exato de admissão (limiar inclusivo)', () => {
    expect(isMonthBeforeMembership(2023, 5, '2023-05-01')).toBe(false);
  });

  it('retorna false para mês posterior ao mês de admissão no mesmo ano', () => {
    expect(isMonthBeforeMembership(2023, 6, '2023-05-01')).toBe(false);
  });

  it('retorna true para qualquer mês em ano anterior ao de admissão', () => {
    expect(isMonthBeforeMembership(2022, 12, '2023-05-01')).toBe(true);
  });

  it('retorna false para qualquer mês em ano posterior ao de admissão', () => {
    expect(isMonthBeforeMembership(2024, 1, '2023-05-01')).toBe(false);
  });

  it('retorna false quando admissionDate é null (sem restrição)', () => {
    expect(isMonthBeforeMembership(2023, 1, null)).toBe(false);
  });
});
