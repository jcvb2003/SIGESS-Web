export interface Coordinator {
  id?: string;
  tenantId?: string | null;
  unitId?: string | null;
  name: string;
  region: string;
  phone: string;
  email: string;
  notes: string;
  isActive: boolean;
  memberCount?: number;
}

export interface CoordinatorMember {
  id: string;
  nome: string;
  cpf: string;
  situacao: string;
  codigoDoSocio: string;
}
