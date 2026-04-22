import { Session, User } from "@supabase/supabase-js";

export type UserRole = 'admin' | 'operador_financeiro' | 'operador_administrativo' | 'consulta' | 'user';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface LoginCredentials {
  tenantCode: string;
  email: string;
  password: string;
}

export interface AuthContextType extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<boolean>;
  signOut: () => Promise<boolean>;
}

