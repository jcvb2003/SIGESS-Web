// Helpers centralizados de papel — ponto único de tradução entre literal do banco e conceito de produto.
// Quando tenant_role migrar de 'owner'/'member' para 'gestor'/'operador', só este arquivo muda.

export const isOperadorRole = (role: string | null | undefined): boolean =>
  role === 'member';
