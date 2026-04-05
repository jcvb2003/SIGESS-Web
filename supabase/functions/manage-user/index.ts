import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ---------- Handlers de action ----------

async function handleInvite(admin: SupabaseClient, payload: Record<string, string>) {
  const { email, nome, role = 'user', tenantCode } = payload;

  const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://app.sigess.com.br';
  const redirectTo = tenantCode
    ? `${appOrigin}/password?tenant=${tenantCode}`
    : `${appOrigin}/password`;

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { nome, role },
  });
  if (error) throw error;

  if (data.user) {
    await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { role } });
    await admin.from('User').update({ nome, role, ativo: true }).eq('id', data.user.id);
  }
  return data;
}

async function handleCreate(admin: SupabaseClient, payload: Record<string, string>) {
  const { email, password, nome, role = 'user' } = payload;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    user_metadata: { nome, role },
    app_metadata: { role },
    email_confirm: true,
  });
  if (error) throw error;

  if (data.user) {
    await admin.from('User').update({ nome, role, ativo: true }).eq('id', data.user.id);
  }
  return data;
}

async function handleDeactivate(admin: SupabaseClient, payload: Record<string, string>) {
  const { userId } = payload;
  const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: '87600h' });
  if (error) throw error;
  await admin.from('User').update({ ativo: false }).eq('id', userId);
  return { success: true, message: 'Usuário desativado' };
}

async function handleActivate(admin: SupabaseClient, payload: Record<string, string>) {
  const { userId } = payload;
  const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' });
  if (error) throw error;
  await admin.from('User').update({ ativo: true }).eq('id', userId);
  return { success: true, message: 'Usuário ativado' };
}

// ---------- Dispatcher ----------

const ACTION_HANDLERS: Record<
  string,
  (admin: SupabaseClient, payload: Record<string, string>) => Promise<unknown>
> = {
  invite: handleInvite,
  create: handleCreate,
  deactivate: handleDeactivate,
  activate: handleActivate,
};

// ---------- Entry point ----------

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Sem cabeçalho de autorização');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validação de identidade e permissão
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authErr || !user) throw new Error('Acesso não autorizado ou token expirado.');
    if (user.app_metadata?.role !== 'admin') {
      return jsonResponse({ error: 'Operação restrita a Presidentes (admin).' }, 403);
    }

    const { action, payload } = await req.json();
    const handler = ACTION_HANDLERS[action];
    if (!handler) throw new Error(`Ação '${action}' desconhecida.`);

    const result = await handler(supabaseAdmin, payload);
    return jsonResponse(result);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Edge Function Error:', message, error); return jsonResponse({ error: message }, 400);
  }
});
