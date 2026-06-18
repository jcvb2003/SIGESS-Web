import { vi } from 'vitest';

type ResolvedValue = { data?: unknown; error: unknown; count?: number };

export function buildQueryMock(resolvedValue: ResolvedValue = { data: null, error: null, count: 0 }) {
  const p = Promise.resolve(resolvedValue);

  return {
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    // Terminal para searchMembers (usa .range())
    range: vi.fn().mockResolvedValue(resolvedValue),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    // Torna o objeto awaitable — para updateMember, countMembers (await query direto)
    then: p.then.bind(p),
    catch: p.catch.bind(p),
    finally: p.finally.bind(p),
  };
}
