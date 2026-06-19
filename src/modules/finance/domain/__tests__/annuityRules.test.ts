import { describe, it, expect } from 'vitest';
import { getRequiredYears } from '../annuityRules';

describe('getRequiredYears', () => {
  it('retorna array com ano único quando anoBase === currentYear', () => {
    expect(getRequiredYears(2024, 2024)).toEqual([2024]);
  });

  it('retorna sequência completa de anos', () => {
    expect(getRequiredYears(2022, 2024)).toEqual([2022, 2023, 2024]);
  });

  it('retorna array vazio quando anoBase > currentYear', () => {
    expect(getRequiredYears(2025, 2024)).toEqual([]);
  });
});
