import { supabase } from "@/shared/lib/supabase/client";
import { LoginCredentials } from "@/shared/types/auth.types";
import { ServiceResponse } from "@/shared/services/base/serviceResponse";
import { Session, User } from "@supabase/supabase-js";
export const authService = {
  async signIn({ email, password }: LoginCredentials): Promise<
    ServiceResponse<{
      user: User;
      session: Session;
    }>
  > {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { data: null, error };
    }
    return { data, error: null };
  },
  async signOut(): Promise<ServiceResponse<void>> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { data: null, error };
    }
    return { data: null, error: null };
  },
  async getSession(): Promise<
    ServiceResponse<{
      session: Session | null;
    }>
  > {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { data: null, error };
    }
    return { data, error: null };
  },
  async getUser(): Promise<
    ServiceResponse<{
      user: User | null;
    }>
  > {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return { data: null, error };
    }
    return { data, error: null };
  },
  async updatePassword(password: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return { data: null, error };
    }
    return { data: null, error: null };
  },
  async resetPassword(email: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof globalThis === 'undefined' ? '' : globalThis.location.origin}/password`,
    });
    if (error) {
      return { data: null, error };
    }
    return { data: null, error: null };
  },
  async createUser(
    email: string,
    password: string,
  ): Promise<
    ServiceResponse<{
      user: User | null;
      session: Session | null;
    }>
  > {
    return {
      data: null,
      error: new Error(
        `Criação de usuário deve ocorrer no backend para o email ${email} e senha ${password ? 'fornecida' : ''}.`,
      ),
    };
  },
};
