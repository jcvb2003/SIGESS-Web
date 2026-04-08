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

  console.log(`[ManageUser] Convidando usuário: ${email} (${role})`);

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { nome, role },
  });
  
  if (error) {
    console.error(`[ManageUser] Erro no inviteUserByEmail:`, error.message, error);
    throw error;
  }

  if (data.user) {
    // 1. Garantir app_metadata sincronizado
    await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { role } });
    
    // 2. Blindagem: Usar UPSERT para garantir que a linha exista na public.User
    // mesmo que a trigger handle_new_user tenha falhado ou atrasado.
    const { error: upsertErr } = await admin.from('User').upsert({ 
      id: data.user.id, 
      email: data.user.email,
      nome, 
      role, 
      ativo: true 
    }, { onConflict: 'id' });

    if (upsertErr) {
      console.warn(`[ManageUser] Aviso: Falha no upsert secundário (User):`, upsertErr.message);
      // Não lançamos erro aqui para não invalidar o convite que já foi enviado com sucesso no Auth
    }
  }
  return data;
}

async function handleCreate(admin: SupabaseClient, payload: Record<string, string | boolean>) {
  const { email, password, nome, role = 'user', email_confirm = true } = payload;

  console.log(`[ManageUser] Criando usuário manual: ${email} (${role})`);

  const { data, error } = await admin.auth.admin.createUser({
    email: email as string,
    password: password as string,
    user_metadata: { nome, role },
    app_metadata: { role },
    email_confirm: email_confirm as boolean,
  });
  if (error) throw error;

  if (data.user) {
    // Sincronização manual imediata
    await admin.from('User').upsert({ 
      id: data.user.id, 
      email: data.user.email,
      nome, 
      role, 
      ativo: true 
    });
  }
  return data;
}

async function handleDeactivate(admin: SupabaseClient, payload: Record<string, string>) {
  const { userId } = payload;
  console.log(`[ManageUser] Desativando usuário: ${userId}`);
  
  const { error: authError } = await admin.auth.admin.updateUserById(userId, { ban_duration: '876600h' });
  if (authError) throw authError;

  // Garantir sincronização na tabela pública (usamos upsert por segurança se for legado)
  await admin.from('User').update({ ativo: false }).eq('id', userId);
  
  return { success: true, message: 'Usuário desativado e banido no Auth' };
}

async function handleActivate(admin: SupabaseClient, payload: Record<string, string>) {
  const { userId } = payload;
  console.log(`[ManageUser] Reativando usuário: ${userId}`);

  const { error: authError } = await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' });
  if (authError) throw authError;

  await admin.from('User').update({ ativo: true }).eq('id', userId);
  return { success: true, message: 'Usuário ativado' };
}

// ---------- Dispatcher ----------

const ACTION_HANDLERS: Record<
  string,
  (admin: SupabaseClient, payload: Record<string, any>) => Promise<unknown>
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
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    
    if (authErr || !user) {
       console.error(`[ManageUser] Erro de autenticação do chamador:`, authErr);
       throw new Error('Acesso não autorizado ou token expirado.');
    }

    if (user.app_metadata?.role !== 'admin') {
      console.warn(`[ManageUser] Tentativa de acesso não-admin por: ${user.email}`);
      return jsonResponse({ error: 'Operação restrita a Presidentes (admin).' }, 403);
    }

    const { action, payload } = await req.json();
    const handler = ACTION_HANDLERS[action];
    if (!handler) throw new Error(`Ação '${action}' desconhecida.`);

    const result = await handler(supabaseAdmin, payload);
    return jsonResponse(result);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    const status = message.includes('authorized') ? 401 : 400;
    
    console.error(`[ManageUser] Erro fatal:`, message, error);
    return jsonResponse({ error: message }, status);
  }
});
