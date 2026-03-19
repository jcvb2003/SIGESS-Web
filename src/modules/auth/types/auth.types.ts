import { Session, User } from "@supabase/supabase-js";
export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}
export interface LoginCredentials {
  email: string;
  password: string;
}
export interface AuthContextType extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<boolean>;
  signOut: () => Promise<boolean>;
}
