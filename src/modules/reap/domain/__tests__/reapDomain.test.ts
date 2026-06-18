import { describe, it, expect } from 'vitest';
import { calculateReapStatus } from '../reapDomain';

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
