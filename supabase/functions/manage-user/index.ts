import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type TenantRole = "owner" | "member";

interface AccessScope {
  mode: "isolated" | "shared";
  isAdmin: boolean;
  tenantId: string | null;
  tenantRole: TenantRole | null;
  unitIds: string[];
}

function isMissingSharedSchemaError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string; status?: number };
  const code = String(candidate.code ?? "");
  const message = String(candidate.message ?? "");
  return (
    candidate.status === 404 ||
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("tenant_users") ||
    message.includes("user_unit_memberships")
  );
}

async function resolveAccessScope(admin: SupabaseClient, currentUser: User): Promise<AccessScope> {
  const isAdmin = currentUser.app_metadata?.role === "admin";

  const { data: tenantUser, error: tenantUserError } = await admin
    .from("tenant_users")
    .select("tenant_id, tenant_role")
    .eq("user_id", currentUser.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (tenantUserError) {
    if (isMissingSharedSchemaError(tenantUserError)) {
      return { mode: "isolated", isAdmin, tenantId: null, tenantRole: null, unitIds: [] };
    }
    throw tenantUserError;
  }

  const tenantId = (tenantUser as { tenant_id?: string | null } | null)?.tenant_id ?? null;
  const tenantRole = ((tenantUser as { tenant_role?: TenantRole | null } | null)?.tenant_role ?? null) as TenantRole | null;

  if (!tenantId || !tenantRole) {
    return { mode: "isolated", isAdmin, tenantId: null, tenantRole: null, unitIds: [] };
  }

  if (tenantRole === "owner") {
    return { mode: "shared", isAdmin, tenantId, tenantRole, unitIds: [] };
  }

  const { data: memberships, error: membershipsError } = await admin
    .from("user_unit_memberships")
    .select("unit_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", currentUser.id)
    .eq("is_active", true);

  if (membershipsError) {
    if (isMissingSharedSchemaError(membershipsError)) {
      return { mode: "shared", isAdmin, tenantId, tenantRole, unitIds: [] };
    }
    throw membershipsError;
  }

  return {
    mode: "shared",
    isAdmin,
    tenantId,
    tenantRole,
    unitIds: (memberships ?? [])
      .map((row) => (row as { unit_id?: string | null }).unit_id)
      .filter((value): value is string => Boolean(value)),
  };
}

function canManageOtherUsers(scope: AccessScope) {
  return scope.isAdmin;
}

function canViewAllUsers(scope: AccessScope) {
  if (scope.mode === "shared") {
    return scope.tenantRole === "owner";
  }
  return scope.isAdmin;
}

async function listSharedAllowedIds(
  admin: SupabaseClient,
  scope: AccessScope,
  currentUser: User,
  activeUnitId?: string | null,
) {
  if (!scope.tenantId) {
    return [currentUser.id];
  }

  if (scope.tenantRole === "owner") {
    if (activeUnitId) {
      const { data: memberships, error } = await admin
        .from("user_unit_memberships")
        .select("user_id")
        .eq("tenant_id", scope.tenantId)
        .eq("is_active", true)
        .eq("unit_id", activeUnitId);

      if (error) throw error;

      return Array.from(
        new Set(
          (memberships ?? [])
            .map((row) => (row as { user_id?: string | null }).user_id)
            .filter((value): value is string => Boolean(value))
            .concat(currentUser.id),
        ),
      );
    }

    const { data: tenantUsers, error } = await admin
      .from("tenant_users")
      .select("user_id")
      .eq("tenant_id", scope.tenantId)
      .eq("is_active", true);

    if (error) throw error;

    return Array.from(
      new Set(
        (tenantUsers ?? [])
          .map((row) => (row as { user_id?: string | null }).user_id)
          .filter((value): value is string => Boolean(value)),
      ),
    );
  }

  if (scope.unitIds.length === 0) {
    return [currentUser.id];
  }

  const filteredUnitIds =
    activeUnitId && scope.unitIds.includes(activeUnitId)
      ? [activeUnitId]
      : scope.unitIds;

  const { data: memberships, error } = await admin
    .from("user_unit_memberships")
    .select("user_id")
    .eq("tenant_id", scope.tenantId)
    .eq("is_active", true)
    .in("unit_id", filteredUnitIds);

  if (error) throw error;

  return Array.from(
    new Set(
      (memberships ?? [])
        .map((row) => (row as { user_id?: string | null }).user_id)
        .filter((value): value is string => Boolean(value))
        .concat(currentUser.id),
    ),
  );
}

async function attachUserToSharedScope(
  admin: SupabaseClient,
  scope: AccessScope,
  currentUser: User,
  createdUserId: string,
  role: string,
  activeUnitId?: string | null,
) {
  if (scope.mode !== "shared" || !scope.tenantId) {
    return;
  }

  if (!activeUnitId) {
    throw new Error("Polo ativo obrigatório para cadastrar usuários neste contexto.");
  }

  if (scope.tenantRole !== "owner" && !scope.unitIds.includes(activeUnitId)) {
    throw new Error("Polo fora do escopo do usuário atual.");
  }

  const operatorType = role === "admin" ? "presidente" : "auxiliar";

  const { error: tenantUserError } = await admin
    .from("tenant_users")
    .upsert(
      {
        tenant_id: scope.tenantId,
        user_id: createdUserId,
        tenant_role: "member",
        operator_type: operatorType,
        is_active: true,
      },
      { onConflict: "tenant_id,user_id" },
    );

  if (tenantUserError) throw tenantUserError;

  const membershipPayload = {
    tenant_id: scope.tenantId,
    user_id: createdUserId,
    unit_id: activeUnitId,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data: existingMembership, error: existingMembershipError } = await admin
    .from("user_unit_memberships")
    .select("id")
    .eq("user_id", createdUserId)
    .eq("unit_id", activeUnitId)
    .maybeSingle();

  if (existingMembershipError) throw existingMembershipError;

  if (existingMembership) {
    const { error: updateMembershipError } = await admin
      .from("user_unit_memberships")
      .update(membershipPayload)
      .eq("id", (existingMembership as { id: string }).id);

    if (updateMembershipError) throw updateMembershipError;
    return;
  }

  const { error: insertMembershipError } = await admin
    .from("user_unit_memberships")
    .insert({
      ...membershipPayload,
      created_at: new Date().toISOString(),
    });

  if (insertMembershipError) throw insertMembershipError;
}

function mapMergedUser(
  currentUser: User,
  authUser: Partial<User> | null,
  publicUser: Record<string, unknown> | null,
) {
  return {
    id: String(publicUser?.id ?? authUser?.id ?? currentUser.id),
    email:
      (publicUser?.email ? String(publicUser.email) : null) ??
      authUser?.email ??
      currentUser.email ??
      null,
    nome:
      (publicUser?.nome ? String(publicUser.nome) : null) ??
      ((authUser?.user_metadata as { nome?: string } | undefined)?.nome ?? null),
    role:
      (publicUser?.role ? String(publicUser.role) : null) ??
      ((authUser?.app_metadata as { role?: string } | undefined)?.role ?? null) ??
      "user",
    ativo: publicUser?.ativo !== undefined ? Boolean(publicUser.ativo) : true,
    createdAt:
      (publicUser?.createdAt ? String(publicUser.createdAt) : null) ??
      authUser?.created_at ??
      currentUser.created_at,
    emailConfirmedAt: authUser?.email_confirmed_at ?? currentUser.email_confirmed_at,
  };
}

// ---------- Handlers de action ----------

async function handleInvite(admin: SupabaseClient, payload: Record<string, string>) {
  const { email, nome, role = "user", tenantCode } = payload;

  const appOrigin = Deno.env.get("APP_ORIGIN") || "https://app.sigess.com.br";
  const redirectTo = tenantCode
    ? `${appOrigin}/password?tenant=${tenantCode}`
    : `${appOrigin}/password`;

  console.log(`[ManageUser] Convidando usuário: ${email} (${role})`);

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { nome, role },
  });

  if (error) {
    console.error("[ManageUser] Erro no inviteUserByEmail:", error.message, error);
    throw error;
  }

  if (data.user) {
    await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { role } });

    const { error: upsertErr } = await admin.from("User").upsert(
      {
        id: data.user.id,
        email: data.user.email,
        nome,
        role,
        ativo: true,
      },
      { onConflict: "id" },
    );

    if (upsertErr) {
      console.warn("[ManageUser] Aviso: Falha no upsert secundário (User):", upsertErr.message);
    }
  }
  return data;
}

async function handleInviteWithScope(
  admin: SupabaseClient,
  scope: AccessScope,
  currentUser: User,
  payload: Record<string, string>,
) {
  const data = await handleInvite(admin, payload);
  const createdUserId =
    (data as { user?: { id?: string } } | null)?.user?.id ??
    (data as { id?: string } | null)?.id ??
    null;

  if (createdUserId) {
    await attachUserToSharedScope(
      admin,
      scope,
      currentUser,
      createdUserId,
      String(payload.role ?? "user"),
      typeof payload.activeUnitId === "string" ? payload.activeUnitId : null,
    );
  }

  return data;
}

async function handleCreate(admin: SupabaseClient, payload: Record<string, string | boolean>) {
  const { email, password, nome, role = "user", email_confirm = true } = payload;

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
    await admin.from("User").upsert({
      id: data.user.id,
      email: data.user.email,
      nome,
      role,
      ativo: true,
    });
  }
  return data;
}

async function handleCreateWithScope(
  admin: SupabaseClient,
  scope: AccessScope,
  currentUser: User,
  payload: Record<string, string | boolean>,
) {
  const data = await handleCreate(admin, payload);
  const createdUserId =
    (data as { user?: { id?: string } } | null)?.user?.id ??
    (data as { id?: string } | null)?.id ??
    null;

  if (createdUserId) {
    await attachUserToSharedScope(
      admin,
      scope,
      currentUser,
      createdUserId,
      String(payload.role ?? "user"),
      typeof payload.activeUnitId === "string" ? payload.activeUnitId : null,
    );
  }

  return data;
}

async function handleDeactivate(admin: SupabaseClient, payload: Record<string, string>) {
  const { userId } = payload;
  console.log(`[ManageUser] Desativando usuário: ${userId}`);

  const { error: authError } = await admin.auth.admin.updateUserById(userId, { ban_duration: "876600h" });
  if (authError) throw authError;

  await admin.from("User").update({ ativo: false }).eq("id", userId);

  return { success: true, message: "Usuário desativado e banido no Auth" };
}

async function handleActivate(admin: SupabaseClient, payload: Record<string, string>) {
  const { userId } = payload;
  console.log(`[ManageUser] Reativando usuário: ${userId}`);

  const { error: authError } = await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  if (authError) throw authError;

  await admin.from("User").update({ ativo: true }).eq("id", userId);
  return { success: true, message: "Usuário ativado" };
}

async function handleDelete(admin: SupabaseClient, payload: Record<string, string>) {
  const { userId } = payload;
  if (!userId) throw new Error("userId é obrigatório para exclusão");

  console.log(`[ManageUser] Excluindo usuário: ${userId}`);

  const { error: tableErr } = await admin.from("User").delete().eq("id", userId);
  if (tableErr) console.warn("[ManageUser] Aviso: falha ao remover de User:", tableErr.message);

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) throw authError;

  return { success: true, message: "Usuário excluído permanentemente" };
}

async function handleResendConfirmation(admin: SupabaseClient, payload: Record<string, string>) {
  const { email, tenantCode } = payload;
  if (!email) throw new Error("email é obrigatório para reenvio de confirmação");

  console.log(`[ManageUser] Reenviando confirmação para: ${email}`);

  const appOrigin = Deno.env.get("APP_ORIGIN") || "https://app.sigess.com.br";
  const redirectTo = tenantCode
    ? `${appOrigin}/password?tenant=${tenantCode}`
    : `${appOrigin}/password`;

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });
  if (error) throw error;

  return { success: true, message: "E-mail de confirmação reenviado com sucesso" };
}

async function handleList(
  admin: SupabaseClient,
  currentUser: User,
  payload?: Record<string, unknown>,
) {
  const scope = await resolveAccessScope(admin, currentUser);
  console.log(
    `[ManageUser] Listando usuários (mode=${scope.mode}, tenantRole=${scope.tenantRole ?? "n/a"}, isAdmin=${scope.isAdmin})...`,
  );

  const allowedIds =
    scope.mode === "shared"
      ? await listSharedAllowedIds(
          admin,
          scope,
          currentUser,
          typeof payload?.activeUnitId === "string" ? payload.activeUnitId : null,
        )
      : scope.isAdmin
        ? null
        : [currentUser.id];

  let dbQuery = admin.from("User").select("*");
  if (allowedIds && allowedIds.length > 0) {
    dbQuery = dbQuery.in("id", allowedIds);
  }

  const { data: publicUsers, error: dbErr } = await dbQuery;
  if (dbErr) throw dbErr;

  if (!scope.isAdmin) {
    const selfPublicUser =
      (publicUsers?.find((user) => String((user as { id?: string }).id ?? "") === currentUser.id) as Record<string, unknown> | undefined) ??
      null;

    return [mapMergedUser(currentUser, currentUser, selfPublicUser)];
  }

  const { data: { users }, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (authError) throw authError;

  const visibleIds =
    allowedIds && allowedIds.length > 0
      ? new Set(allowedIds)
      : new Set((publicUsers ?? []).map((user) => String((user as { id?: string }).id ?? "")));

  return users
    .filter((authUser) => visibleIds.has(authUser.id))
    .map((authUser) => {
      const publicUser =
        (publicUsers?.find((user) => String((user as { id?: string }).id ?? "") === authUser.id) as Record<string, unknown> | undefined) ??
        null;
      return mapMergedUser(currentUser, authUser, publicUser);
    });
}

// ---------- Dispatcher ----------

const ACTION_HANDLERS: Record<
  string,
  (admin: SupabaseClient, payload: Record<string, string | boolean>) => Promise<unknown>
> = {
  invite: handleInvite,
  create: handleCreate,
  deactivate: handleDeactivate,
  activate: handleActivate,
  delete: handleDelete,
  resend_confirmation: handleResendConfirmation,
  list: handleList as unknown as (admin: SupabaseClient, payload: Record<string, string | boolean>) => Promise<unknown>,
  toggleUserStatus: (admin, payload) => {
    const isActive = payload.ativo !== undefined ? payload.ativo : payload.isActive;
    return isActive ? handleDeactivate(admin, payload as Record<string, string>) : handleActivate(admin, payload as Record<string, string>);
  },
};

// ---------- Entry point ----------

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Sem cabeçalho de autorização");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);

    if (authErr || !user) {
      console.error("[ManageUser] Erro de autenticação do chamador:", authErr);
      throw new Error("Acesso não autorizado ou token expirado.");
    }

    const { action, payload = {} } = await req.json();
    const accessScope = await resolveAccessScope(supabaseAdmin, user);

    if (action !== "list" && !accessScope.isAdmin) {
      console.warn(`[ManageUser] Tentativa de ação proibida (${action}) por usuário sem escopo administrativo: ${user.email}`);
      return jsonResponse({ error: "Operação restrita ao gestor da entidade." }, 403);
    }

    if (
      accessScope.mode === "shared" &&
      accessScope.tenantRole !== "owner" &&
      ["deactivate", "activate", "delete", "toggleUserStatus"].includes(String(action))
    ) {
      const targetUserId =
        typeof payload?.userId === "string" ? payload.userId : null;

      if (!targetUserId) {
        return jsonResponse({ error: "Usuário alvo não informado." }, 400);
      }

      const allowedIds = await listSharedAllowedIds(supabaseAdmin, accessScope, user);
      if (!allowedIds.includes(targetUserId)) {
        console.warn(`[ManageUser] Ação ${action} fora do escopo do polo por ${user.email} em ${targetUserId}`);
        return jsonResponse({ error: "Operação fora do escopo do polo." }, 403);
      }
    }

    const handler = ACTION_HANDLERS[action];
    if (!handler) throw new Error(`Ação '${action}' desconhecida.`);

    const result =
      action === "list"
        ? await handleList(supabaseAdmin, user, payload)
        : action === "invite"
          ? await handleInviteWithScope(supabaseAdmin, accessScope, user, payload as Record<string, string>)
          : action === "create"
            ? await handleCreateWithScope(
                supabaseAdmin,
                accessScope,
                user,
                payload as Record<string, string | boolean>,
              )
            : await handler(supabaseAdmin, payload);

    return jsonResponse(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    const status = message.includes("authorized") ? 401 : 400;

    console.error("[ManageUser] Erro fatal:", message, error);
    return jsonResponse({ error: message }, status);
  }
});
